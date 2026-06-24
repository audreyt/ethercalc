#!/bin/bash
set -euo pipefail

# CAUTION: DO NOT MAKE CHANGES TO THIS FILE. The vagrant-spk upgradevm process will overwrite it.
# App-specific setup should be done in the setup.sh file.

# Set options for curl. Since we only want to show errors from these curl commands, we also use
# 'cat' to buffer the output; for more information:
# https://github.com/sandstorm-io/vagrant-spk/issues/158

CURL_OPTS="--silent --show-error --location"
echo localhost > /etc/hostname
hostname localhost
. /opt/app/.sandstorm/.generated/runtime.env

SANDSTORM_INSTALL_SCRIPT_URL="https://install.sandstorm.io/"
SANDSTORM_PACKAGE_URL="${SANDSTORM_DOWNLOAD_URL:-}"

# Grub updates don't silent install well
apt-mark hold grub-pc || true
apt-get update
apt-get upgrade -y

# Install curl needed below, and gnupg for package signing
apt-get install -y curl gnupg netcat-openbsd

# Make the primary guest user part of the sandstorm group so that commands like
# `spk dev` work across providers.
APP_USER="${SUDO_USER:-}"
if [[ -z "${APP_USER}" || "${APP_USER}" == "root" ]]; then
    if id -u vagrant >/dev/null 2>&1; then
        APP_USER="vagrant"
    else
        APP_USER="$(find /home -mindepth 1 -maxdepth 1 -type d -exec basename {} \; | head -n1)"
    fi
fi

host_cache_write() {
    local target="$1"
    local app_user="$2"
    local tmp_target="${target}.spktool-tmp"
    shift 2

    if [[ -z "${app_user}" ]]; then
        "$@" > "${tmp_target}"
        mv "${tmp_target}" "${target}"
        return
    fi

    su -s /bin/bash - "${app_user}" -c "cat > \"${tmp_target}\" && mv \"${tmp_target}\" \"${target}\"" < <("$@")
}

# The following line copies stderr through stderr to cat without accidentally leaving it in the
# output file. Be careful when changing. See: https://github.com/sandstorm-io/vagrant-spk/pull/159
host_cache_write /host-dot-sandstorm/caches/install.sh "${APP_USER}" \
    curl $CURL_OPTS --fail "${SANDSTORM_INSTALL_SCRIPT_URL}" 2>&1 | cat

if [[ -n "${SANDSTORM_PACKAGE_URL}" ]]; then
    SANDSTORM_PACKAGE="${SANDSTORM_PACKAGE_URL##*/}"
    SANDSTORM_CURRENT_VERSION="${SANDSTORM_PACKAGE#sandstorm-}"
    SANDSTORM_CURRENT_VERSION="${SANDSTORM_CURRENT_VERSION%.tar.xz}"
    echo
    echo "========================================"
    echo "CUSTOM SANDSTORM INSTALL URL IN USE"
    echo "${SANDSTORM_PACKAGE_URL}"
    echo "========================================"
    echo
else
    SANDSTORM_CURRENT_VERSION=$(curl $CURL_OPTS -f "https://install.sandstorm.io/dev?from=0&type=install")
    SANDSTORM_PACKAGE="sandstorm-$SANDSTORM_CURRENT_VERSION.tar.xz"
    SANDSTORM_PACKAGE_URL="https://dl.sandstorm.io/$SANDSTORM_PACKAGE"
fi

if [[ ! -f /host-dot-sandstorm/caches/$SANDSTORM_PACKAGE ]] ; then
    echo -n "Downloading Sandstorm version ${SANDSTORM_CURRENT_VERSION}..."
    host_cache_write "/host-dot-sandstorm/caches/$SANDSTORM_PACKAGE.partial" "${APP_USER}" \
        curl $CURL_OPTS --fail "${SANDSTORM_PACKAGE_URL}" 2>&1 | cat
    mv "/host-dot-sandstorm/caches/$SANDSTORM_PACKAGE.partial" "/host-dot-sandstorm/caches/$SANDSTORM_PACKAGE"
    echo "...done."
fi
if [ ! -e /opt/sandstorm/latest/sandstorm ] ; then
    echo -n "Installing Sandstorm version ${SANDSTORM_CURRENT_VERSION}..."
    REPORT=no bash /host-dot-sandstorm/caches/install.sh -d -e -p "${SANDSTORM_GUEST_PORT}" "/host-dot-sandstorm/caches/$SANDSTORM_PACKAGE" >/dev/null
    echo "...done."
fi
modprobe ip_tables
if [[ -n "${APP_USER}" ]] && id -u "${APP_USER}" >/dev/null 2>&1 && getent group sandstorm >/dev/null 2>&1; then
    usermod -a -G 'sandstorm' "${APP_USER}"
fi
# Bind to all addresses, so the vagrant port-forward works.
sudo sed --in-place='' \
        --expression='s/^BIND_IP=.*/BIND_IP=0.0.0.0/' \
        --expression="s#^PORT=.*#PORT=${SANDSTORM_GUEST_PORT}#" \
        --expression="s#^BASE_URL=.*#BASE_URL=${SANDSTORM_BASE_URL}#" \
        --expression="s#^WILDCARD_HOST=.*#WILDCARD_HOST=${SANDSTORM_WILDCARD_HOST}#" \
        /opt/sandstorm/sandstorm.conf

# Force vagrant-spk to use the strict CSP, see sandstorm#3424 for details.
echo 'ALLOW_LEGACY_RELAXED_CSP=false' >> /opt/sandstorm/sandstorm.conf

sudo service sandstorm restart
# Enable apt-cacher-ng proxy to make things faster if one appears to be running on the gateway IP
GATEWAY_IP=$(ip route  | grep ^default  | cut -d ' ' -f 3)
if nc -z "$GATEWAY_IP" 3142 ; then
    echo "Acquire::http::Proxy \"http://$GATEWAY_IP:3142\";" > /etc/apt/apt.conf.d/80httpproxy
fi
# Configure apt to retry fetching things that fail to download.
echo "APT::Acquire::Retries \"10\";" > /etc/apt/apt.conf.d/80sandstorm-retry

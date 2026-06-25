apt-get install -y unzip capnproto

curl -fsSL https://bun.sh/install | BUN_INSTALL=/tmp/.bun bash
sudo mv /tmp/.bun/bin/bun /usr/local/bin/
rm -rf /tmp/.bun
ln -sf /usr/local/bin/bun /usr/local/bin/bunx

#!/bin/bash

function install_docker()
{
    sudo bash -c "curl -fsSL https://get.docker.com/ | sh"
    USER=$(whoami)
    sudo usermod -aG docker $USER
    check_install "docker"
}

function install_compose()
{
    sudo bash -c "curl -L https://github.com/docker/compose/releases/download/1.7.1/docker-compose-`uname -s`-`uname -m` > /usr/local/bin/docker-compose"
    sudo chmod +x /usr/local/bin/docker-compose
    check_install "docker-compose"
}

function check_install()
{
    if [ `$1 --version | grep -i 'command not found' | wc -l` -lt 1 ]; then
        echo "$1 installed successfully"
    else
        echo "Unable to install $1 :("
    fi
}

install_docker && install_compose

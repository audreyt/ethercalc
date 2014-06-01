#!/bin/sh
docker.io run -t -i -c 4 -d -p 127.0.0.1:6379:6379 -p 6967:6967 -v /var/lib/docker/binds/ethercalc-redis:/redis:rw audreyt/ethercalc

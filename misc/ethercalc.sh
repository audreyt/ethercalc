#!/bin/sh
docker run --name redis -d -v /var/lib/docker/binds/ethercalc-redis:/data redis:latest
docker run -d -p 6967:8000 --link redis:redis audreyt/ethercalc

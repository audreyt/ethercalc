#!/bin/sh
docker rm -f redis || true
docker run -p 6379:6379 --name redis -d -v /var/lib/docker/binds/ethercalc-redis:/data redis:latest
docker rm -f ethercalc || true
perl -e 'for (1..30) { exit if `redis-cli ping` =~ /PONG/; sleep 1 }; die "orz"'
docker run -d -p 6967:8000 --name ethercalc --link redis:redis audreyt/ethercalc

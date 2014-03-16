# docker run -d -p 6967:6967 -v /var/lib/docker/binds/ethercalc-redis:/redis:rw audreyt/ethercalc
#
FROM dockerfile/nodejs

ENV DEBIAN_FRONTEND noninteractive
ENV PORT 6967
VOLUME ["/redis"]

RUN echo "deb http://ppa.launchpad.net/chris-lea/redis-server/ubuntu precise main" >> /etc/apt/sources.list
RUN apt-get update
RUN apt-get install -y build-essential python
RUN apt-get install --force-yes -y build-essential python redis-server
RUN export HOME=/tmp ; npm i -g ethercalc pm2

CMD ["sh", "-c", "sysctl vm.overcommit_memory=1 ; cd /redis ; /usr/bin/redis-server --logfile redis.log --dbfilename dump.rdb | (sleep 2 && pm2 start -x /usr/bin/ethercalc -- --cors)"]

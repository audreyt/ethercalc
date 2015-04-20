#
# This image requires a linked redis Docker container:
#
#    docker run --name redis -d -v /docker/host/dir:/data redis redis-server --appendonly yes
#    docker run -d -p 8000:8000 --link redis:redis audreyt/ethercalc
#

FROM node:0.10

RUN useradd ethercalc --create-home
RUN npm install -g ethercalc pm2

USER ethercalc
ENV HOME /home/ethercalc
EXPOSE 8000
CMD ["sh", "-c", "REDIS_HOST=$REDIS_PORT_6379_TCP_ADDR REDIS_PORT=$REDIS_PORT_6379_TCP_PORT pm2 start -x `which ethercalc` -- --cors && pm2 logs"]

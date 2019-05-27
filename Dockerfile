FROM node:4.8

RUN useradd ethercalc --create-home
RUN npm install -g ethercalc pm2 || true
RUN rm -rf /usr/local/lib/node_modules/ethercalc/node_modules/nodemailer/ || true

USER ethercalc
EXPOSE 8000
CMD ["sh", "-c", "REDIS_HOST=$REDIS_PORT_6379_TCP_ADDR REDIS_PORT=$REDIS_PORT_6379_TCP_PORT pm2 start -x `which ethercalc` -- --cors && pm2 logs"]

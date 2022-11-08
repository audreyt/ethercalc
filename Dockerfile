FROM node:18.12.0

RUN useradd ethercalc --create-home
RUN npm config set user root
RUN npm install -g ethercalc
RUN npm install -g pm2 --unsafe
RUN rm -rf /usr/local/lib/node_modules/ethercalc/node_modules/nodemailer/ || true

USER ethercalc
EXPOSE 8000
CMD ["sh", "-c", "REDIS_HOST=$REDIS_PORT_6379_TCP_ADDR REDIS_PORT=$REDIS_PORT_6379_TCP_PORT pm2 start -x `which ethercalc` -- --cors && pm2 logs"]

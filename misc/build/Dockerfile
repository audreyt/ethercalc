FROM 6136a5e22373
RUN export HOME=/tmp ; npm i -g pm2 ethercalc
CMD ["sh", "-c", "sysctl vm.overcommit_memory=1 ; cd /redis ; /usr/bin/redis-server --logfile redis.log --dbfilename dump.rdb | (sleep 2 && pm2 start -x /usr/bin/ethercalc -- --cors)"]

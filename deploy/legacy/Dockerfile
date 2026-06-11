# Legacy Redis-backed EtherCalc (Node + LiveScript).
# Last npm release before the TypeScript rewrite: 0.20201228.1
FROM node:20-bookworm-slim

RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 make g++ \
 && rm -rf /var/lib/apt/lists/*

RUN useradd ethercalc --create-home \
 && npm install -g ethercalc@0.20201228.1 \
 && apt-get purge -y python3 make g++ \
 && apt-get autoremove -y

USER ethercalc
WORKDIR /home/ethercalc
ENV HOME=/home/ethercalc
EXPOSE 8000

# REDIS_HOST / REDIS_PORT must point at the redis service.
# Optional: ETHERCALC_KEY, ETHERCALC_BASEPATH, ETHERCALC_EXPIRE.
CMD ["sh", "-c", "exec ethercalc --host 0.0.0.0 --port 8000 --cors ${ETHERCALC_KEY:+--key \"$ETHERCALC_KEY\"} ${ETHERCALC_BASEPATH:+--basepath \"$ETHERCALC_BASEPATH\"} ${ETHERCALC_EXPIRE:+--expire \"$ETHERCALC_EXPIRE\"}"]
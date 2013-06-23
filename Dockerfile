from    base:latest
run     echo "deb http://ppa.launchpad.net/chris-lea/node.js/ubuntu precise main" >> /etc/apt/sources.list
run     echo "deb http://ppa.launchpad.net/chris-lea/redis-server/ubuntu precise main" >> /etc/apt/sources.list
run     apt-get update
run     apt-get install --force-yes -y nodejs redis-server
add     .  /app
expose  6379
expose  :6967
env     PORT 6967
cmd     ["sh", "-c", "/usr/bin/redis-server | node /app/app.js --cors"]

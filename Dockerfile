from    heroku/heroku-buildpack-nodejs
run     echo "deb http://archive.ubuntu.com/ubuntu precise main universe" > /etc/apt/sources.list
run     apt-get -y install redis-server g++ make
add     .       /app
run     /buildpack/bin/compile /app /tmp
expose  :80
expose  :6379
cmd     ["sh", "-c", "/usr/bin/redis-server | PORT=80 /app/bin/node /app/app.js --cors"]

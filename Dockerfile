from    heroku/heroku-buildpack-nodejs
add     .       /app
run     /buildpack/bin/compile /app /tmp
cmd     ["sh", "-c", "PORT=5000 /app/bin/node /app/app.js"]

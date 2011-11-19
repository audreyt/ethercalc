@include = -> try
  json = require('fs').readFileSync('/home/dotcloud/environment.json', 'utf8')
  env = process.env
  { DOTCLOUD_DATA_REDIS_HOST: env.REDIS_HOST
  , DOTCLOUD_DATA_REDIS_PORT: env.REDIS_PORT
  , DOTCLOUD_DATA_REDIS_PASSWORD: env.REDIS_PASS
  } = JSON.parse(json)

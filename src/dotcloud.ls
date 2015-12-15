@include = -> try
  {env} = process
  @io.configure ~> @io.set \transports if @KEY or @POLLING
     then <[ jsonp-polling ]>
     else if env.SUBDOMAIN and env.NODE_ENV
       then <[ websocket xhr-polling jsonp-polling ]>
       else <[ websocket flashsocket xhr-polling jsonp-polling ]>

  json  = require \fs .readFileSync \/home/dotcloud/environment.json \utf8

  {
    DOTCLOUD_DATA_REDIS_HOST:   env.REDIS_HOST
    DOTCLOUD_DATA_REDIS_PORT:   env.REDIS_PORT
    DOTCLOUD_DATA_REDIS_PASSWORD: env.REDIS_PASS
  } = JSON.parse json

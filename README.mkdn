# EtherCalc

* Overview: https://ethercalc.net/
* 中文版: http://tw.ethercalc.net/
* 简体中文: http://cn.ethercalc.net/
* REST API: http://docs.ethercalc.apiary.io/

* Language: [LiveScript](http://livescript.net/)
* Runtime: [Node.js](http://nodejs.org/) (4.x preferred, should work with 0.8+)
* Services: [Redis](http://redis.io) (2.4+; fall-back to on-disk JSON storage if not present)
    * Multi-server is supported _only_ when running with Redis
    * Note to Redis 2.2 users (e.g. on Ubuntu 12.04): Please disable the `timeout 300` setting in `/etc/redis.conf`, or upgrade to Redis 2.4+ if possible at all. For more details, see [#49](https://github.com/audreyt/ethercalc/issues/49#issuecomment-25331595).
* Browsers tested: Safari, Chrome, Firefox, IE.
* Integrated with content management systems:
    * [Socialtext](http://www.socialtext.com/)
    * [Drupal](https://drupal.org/project/sheetnode)

## Installation

For global installation (may need root)

    npm i -g ethercalc
    ethercalc

For local non-root installation

    git clone git@github.com:audreyt/ethercalc.git
    cd ethercalc
    npm i
    make

Nodejs older than 6.0

    downgrade Nodemailer to v2.7.2

Or install with our [Docker](http://www.docker.io/) image, which comes with
support for webworker-threads:

    # Install docker and docker-compose
    sudo ./misc/linux-install-docker-and-compose.sh

    # Run ethercalc on port 80 ( http://localhost/ )
    docker-compose up -d

Config database

    set env vars:
      REDIS_PORT REDIS_HOST REDIS_SOCKPATH REDIS_PASS REDIS_DB OPENSHIFT_DATA_DIR

    Defaults:
      REDIS_HOST = localhost   
      REDIS_PORT = 6379   
      OPENSHIFT_DATA_DIR= process.cwd!

    OPENSHIFT_DATA_DIR is used if redis is not Running.

    Code is here:
    https://github.com/audreyt/ethercalc/blob/df758d4c2f5cbcb00b50e9289a8ba237d4f8fa86/src/db.ls#L5


Send email

    Optional - Send email formulas requires OAuth2 & cron  e.g. =email(to, subject, body), =emailAt(time, to, subject, body)

    OAuth2 - Set environment vars
    1) Tutorial: follow the tutorial to get the 4 environment vars http://masashi-k.blogspot.com.au/2013/06/sending-mail-with-gmail-using-xoauth2.html
    2) Set 4 environment vars - see [src/emailer.ls] vars: user, clientId, clientSecret, refreshToken
    Tested using gmail, have not tested with other providors

    Cron - Required for emailAt formulas.
    See *curl* in [.openshift/cron/minutely/timetrigger] for openshift version (openshift](openshift.redhat.com)
    The curl checks the database for unsent emails and updates the database after sending.

## REST API

Please see [API.md](https://github.com/audreyt/ethercalc/blob/master/API.md)
for the API Blueprint, or [the online version at Apiary](http://docs.ethercalc.apiary.io/).

## Runtime Flags

### Listening Interface: `--host` / `--port`

Specify a specific host and/or a different port for the service.

By default EtherCalc listens at `0.0.0.0:8000` (all IPv4 interfaces).

### Using SSL: `--keyfile` / `--certfile`

    openssl genrsa -out ethercalc-key.pem 1024
    openssl req -new -key ethercalc-key.pem -out certrequest.csr
    openssl x509 -req -in certrequest.csr -signkey ethercalc-key.pem -out ethercalc-cert.pem
    ethercalc --keyfile ethercalc-key.pem --certfile ethercalc-cert.pem

### Prefers polling over Websocket: `--polling`

Useful when running behind a proxy without WebSocket support.

### Enable Cross-Origin Resource Sharing: `--cors`

Useful when setting up EtherCalc as a public REST API server.

### URL Prefix: `--basepath /path/prefix`

Useful when running under an URL rewriter. If running with a nginx reverse
proxy, please add this section:

```
    location /zappa/socket/__local/ {
        rewrite (.*) /path/prefix$1;
    }
```


### Access Control: `--key secret`

Offers read-write vs. read-only modes. See issues [#1](https://github.com/audreyt/ethercalc/issues/1) and [#4](https://github.com/audreyt/ethercalc/issues/4) for details on setting this up.

### Disable server-side WebWorkers: `--vm`

Runs a single-thread background loop with `vm.createContext` instead of `webworker-threads`.

Useful for running custom functions in server side that requires full VM access.

### Expires inactive spreadsheets: `--expire 86400`

Deletes a spreadsheet's content after N seconds of inactivity. Activities include accessing with REST API as well as Web UI, including moving the active cell cursor on an opened page.

# Licensing

### Common Public Attribution License (Socialtext Inc.)

* socialcalcspreadsheetcontrol.js
* socialcalctableeditor.js

### Artistic License 2.0 (Socialtext Inc.)

* formatnumber2.js
* formula1.js
* socialcalc-3.js
* socialcalcconstants.js
* socialcalcpopup.js

#### Artistic License 2.0 (Framasoft)

* l10n/fr.json

### MIT License (John Resig, The Dojo Foundation)

* static/jquery.js

### MIT License (HubSpot, Inc.)

* static/vex-theme-flat-attack.css
* static/vex.combined.min.js
* static/vex.css

### MIT License (Stuart Knightley, David Duponchel, Franz Buchinger, Ant'onio Afonso)

* static/jszip.js

### Apache License 2.0 (SheetJS)

* static/shim.js
* static/xlsx.js
* static/xlsxworker.js
* start.html (xlsx2socialcalc.js)

### CC0 Public Domain (唐鳳)

* src/*.ls

### Mozilla Public License Version 2.0 (LibreOffice contributors)

* images/sc_*.png


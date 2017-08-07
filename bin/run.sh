#!/bin/sh

#Move to the folder where Ethercalc is installed
cd `dirname $0`

#Was this script started in the bin folder? if yes move out
if [ -d "../bin" ]; then
  cd "../"
fi

ignoreRoot=0
for ARG in $*
do
  if [ "$ARG" = "--root" ]; then
    ignoreRoot=1
  fi
done

#Stop the script if its started as root
if [ "$(id -u)" -eq 0 ] && [ $ignoreRoot -eq 0 ]; then
   echo "You shouldn't start Ethercalc as root!"
   echo "Please type 'Ethercalc rocks my socks' or supply the '--root' argument if you still want to start it as root"
   read rocks
   if [ "$rocks" != "Ethercalc rocks my socks" ]
   then
     echo "Your input was incorrect"
     exit 1
   fi
fi

#start redis server
#Note: enable this if your redis server is not already running!
#redis-server /path/to/my/redis.conf

# manual redis config

#export REDIS_HOST=localhost
#export REDIS_PORT=1234
#export REDIS_PASS=mypassword
#export REDIS_DB=0

# When settings sensitive information here (redis password) remember to secure the file to prevent other users from reading it!

# enable production mode
export NODE_ENV=production

#finally start Ethercalc
echo "Started Ethercalc..."

bin/ethercalc $@

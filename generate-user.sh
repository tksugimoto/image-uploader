#!/bin/sh
set -e

if [ "${1}" != "" ]; then
    user_name=${1}
    docker-compose -f docker-compose.mc.yml run --rm mc generate-minio-user ${user_name}
else
	echo "usage: generate-user.sh <user_name>"
fi

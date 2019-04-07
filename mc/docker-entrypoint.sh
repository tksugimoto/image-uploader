#!/bin/sh
set -e

source /etc/mc/.env
TARGET=myminio

mc config host add ${TARGET} http://minio:9000 $MINIO_ACCESS_KEY $MINIO_SECRET_KEY

if [ "${1}" == "generate-minio-user" ]; then
	if [ "${2}" == "" ]; then
		echo "<user_name> required"
	else
		user_name=${2}
		bucket_name=${user_name}
		ACCESS_KEY=${user_name}
		SECRET_KEY=$(cat /dev/urandom | base64 | fold -w 20 | head -n 1)
		policy_name=readwrite_${bucket_name}

		cat > /tmp/${policy_name}.json <<- EOS
		{
			"Version": "2012-10-17",
			"Statement": [{
				"Effect": "Allow",
				"Action": ["s3:*"],
				"Resource": [
					"arn:aws:s3:::${bucket_name}",
					"arn:aws:s3:::${bucket_name}/*"
				]
			}]
		}
		EOS

		mc mb ${TARGET}/${bucket_name}
		mc policy download ${TARGET}/${bucket_name}
		mc admin policy add ${TARGET} ${policy_name} /tmp/${policy_name}.json
		mc admin user add ${TARGET} ${ACCESS_KEY} ${SECRET_KEY} ${policy_name}

		echo "=========================="
		echo "ACCESS_KEY: ${ACCESS_KEY}"
		echo "SECRET_KEY: ${SECRET_KEY}"
		echo "=========================="
	fi
elif [ "${1}" == "help" ]; then
	echo "usage: generate-minio-user <user_name>"
else
	exec "$@"
fi

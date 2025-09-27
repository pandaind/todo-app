#!/bin/sh

# Set default backend URL if not provided
if [ -z "$BACKEND_URL" ]; then
    export BACKEND_URL="http://backend:5000"
fi

echo "Backend URL: $BACKEND_URL"

# Substitute environment variables in nginx config
envsubst '${BACKEND_URL}' < /etc/nginx/conf.d/default.conf > /tmp/default.conf
mv /tmp/default.conf /etc/nginx/conf.d/default.conf

echo "Nginx configuration:"
cat /etc/nginx/conf.d/default.conf

# Execute the main command
exec "$@"
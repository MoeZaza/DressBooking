#!/bin/bash

start_time=$(date +%s)
echo "Deploying BookDress frontend..."

cd /opt/bookdress
git pull
sudo chmod +x -R /opt/bookdress/__scripts

/bin/bash /opt/bookdress/__scripts/free-mem.sh

cd /opt/bookdress/frontend

npm install --force
npm run build

sudo rm -rf /var/www/bookdress/frontend
sudo mkdir -p /var/www/bookdress/frontend
sudo cp -rf build/* /var/www/bookdress/frontend

sudo rm -rf /var/cache/nginx
sudo systemctl restart nginx
sudo systemctl status nginx --no-pager

/bin/bash /opt/bookdress/__scripts/free-mem.sh

finish_time=$(date +%s)
elapsed_time=$((finish_time - start_time))
((sec=elapsed_time%60, elapsed_time/=60, min=elapsed_time%60))
timestamp=$(printf "BookDress frontend deployed in %d minutes and %d seconds." $min $sec)
echo "$timestamp"

#$SHELL

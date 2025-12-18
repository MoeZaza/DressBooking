#!/bin/bash

start_time=$(date +%s)
echo "Deploying BookDress API..."

cd /opt/bookdress
git pull
chmod +x -R /opt/bookdress/__scripts

/bin/bash /opt/bookdress/__scripts/free-mem.sh

cd /opt/bookdress/api

npm install --omit=dev

sudo systemctl restart bookdress
sudo systemctl status bookdress --no-pager

/bin/bash /opt/bookdress/__scripts/free-mem.sh

finish_time=$(date +%s)
elapsed_time=$((finish_time - start_time))
((sec=elapsed_time%60, elapsed_time/=60, min=elapsed_time%60))
timestamp=$(printf "BookDress API deployed in %d minutes and %d seconds." $min $sec)
echo "$timestamp"

#$SHEL

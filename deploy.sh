#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"
source ./deploy.env

npm run build

tar -C dist -cf - . | ssh "$DEPLOY_HOST" "
  set -e
  rm -rf $DEPLOY_ROOT.new
  mkdir -p $DEPLOY_ROOT.new
  tar -C $DEPLOY_ROOT.new -xf -
  rm -rf $DEPLOY_ROOT.old
  if [ -d $DEPLOY_ROOT ]; then mv $DEPLOY_ROOT $DEPLOY_ROOT.old; fi
  mv $DEPLOY_ROOT.new $DEPLOY_ROOT
"

ssh "$DEPLOY_HOST" "mkdir -p /opt/4image-preview && cat > /opt/4image-preview/preview.mjs && systemctl restart 4image-preview" < server/preview.mjs

curl -fsS -o /dev/null -w "%{http_code} $DEPLOY_URL\n" "$DEPLOY_URL"

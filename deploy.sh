#!/bin/bash
set -euo pipefail

ORIGIN_URL=$(git remote get-url origin)

npm run build

cd dist
git init
git add .
git commit -m "gh-pages"
git remote add origin "$ORIGIN_URL"
git push --force origin HEAD:gh-pages
cd ..
rm -rf dist

echo "Deployed to gh-pages"

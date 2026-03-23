#!/bin/bash
set -e

npm install --legacy-peer-deps 2>/dev/null || npm install --force

npm run db:push 2>/dev/null || echo "db:push skipped or not configured"

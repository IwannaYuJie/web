#!/usr/bin/env bash
set -euo pipefail

backup_root=/var/backups/orange-cat-blog
data_file=/var/lib/orange-cat-blog/articles.json
timestamp=$(date -u +%Y%m%dT%H%M%SZ)

install -d -o orange-cat -g orange-cat -m 0750 "$backup_root"
install -o orange-cat -g orange-cat -m 0640 "$data_file" "$backup_root/articles-$timestamp.json"
find "$backup_root" -type f -name 'articles-*.json' -mtime +14 -delete

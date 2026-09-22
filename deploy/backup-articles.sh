#!/usr/bin/env bash
set -euo pipefail

backup_root=/var/backups/orange-cat-blog
data_file=/var/lib/orange-cat-blog/articles.json
timestamp=$(date -u +%Y%m%dT%H%M%SZ)

install -d -o orange-cat -g orange-cat -m 0750 "$backup_root"
drafts_file=/var/lib/orange-cat-blog/news-drafts.json
# 发布先提交文章、再提交草稿状态；反向取快照可由 newsDraftId 安全恢复中途发布。
if [[ -f "$drafts_file" ]]; then
  install -o orange-cat -g orange-cat -m 0640 "$drafts_file" "$backup_root/news-drafts-$timestamp.json"
fi
install -o orange-cat -g orange-cat -m 0640 "$data_file" "$backup_root/articles-$timestamp.json"
find "$backup_root" -type f -name 'articles-*.json' -mtime +14 -delete
find "$backup_root" -type f -name 'news-drafts-*.json' -mtime +14 -delete

#!/usr/bin/env bash
set -Eeuo pipefail

umask 022

readonly repo_url="https://github.com/IwannaYuJie/web.git"
readonly branch="main"
readonly deploy_user="orange-cat-deploy"
readonly state_root="/var/lib/orange-cat-blog-deploy"
readonly repo_dir="$state_root/repo"
readonly work_root="$state_root/work"
readonly deploy_home="$state_root/home"
readonly npm_cache="$state_root/npm-cache"
readonly deployed_commit_file="$state_root/deployed-commit"
readonly release_root="/opt/orange-cat-blog/releases"
readonly current_link="/opt/orange-cat-blog/current"
readonly service_name="orange-cat-blog.service"
readonly lock_file="/run/orange-cat-blog-deploy.lock"

work_dir=""

log() {
    printf '[orange-cat-deploy] %s\n' "$*"
}

cleanup() {
    if [[ -n "$work_dir" && "$work_dir" == "$work_root"/deploy.* && -d "$work_dir" ]]; then
        rm -rf -- "$work_dir"
    fi
}

rollback() {
    local previous_target="$1"

    if [[ -n "$previous_target" && -d "$previous_target" ]]; then
        log "health check failed; rolling back to $previous_target"
        ln -sfn "$previous_target" "$current_link.next"
        mv -Tf "$current_link.next" "$current_link"
        systemctl restart "$service_name"
    fi
}

run_as_deployer() {
    runuser -u "$deploy_user" -- env \
        HOME="$deploy_home" \
        NPM_CONFIG_CACHE="$npm_cache" \
        CI=1 \
        "$@"
}

wait_for_local_health() {
    local attempt

    for attempt in {1..20}; do
        if curl --fail --silent --show-error --max-time 5 \
            http://127.0.0.1:8361/healthz >/dev/null; then
            return 0
        fi
        sleep 1
    done

    return 1
}

trap cleanup EXIT

if [[ "${EUID:-$(id -u)}" -ne 0 ]]; then
    log "must run as root"
    exit 1
fi

exec 9>"$lock_file"
if ! flock -n 9; then
    log "another deployment is already running"
    exit 0
fi

for command_name in git node npm runuser flock curl systemctl; do
    command -v "$command_name" >/dev/null
done

if ! id "$deploy_user" >/dev/null 2>&1; then
    log "missing deployment user: $deploy_user"
    exit 1
fi

install -d -o root -g root -m 0755 "$state_root"
install -d -o "$deploy_user" -g "$deploy_user" -m 0750 \
    "$repo_dir" "$work_root" "$deploy_home" "$npm_cache"
install -d -o root -g root -m 0755 "$release_root"

if [[ ! -d "$repo_dir/.git" ]]; then
    if find "$repo_dir" -mindepth 1 -print -quit | grep -q .; then
        log "$repo_dir is not empty and is not a Git checkout"
        exit 1
    fi

    log "cloning $repo_url"
    run_as_deployer git clone --filter=blob:none --no-checkout "$repo_url" "$repo_dir"
fi

log "checking origin/$branch"
run_as_deployer git -C "$repo_dir" fetch --prune --depth=1 \
    origin "+refs/heads/$branch:refs/remotes/origin/$branch"

remote_commit=$(run_as_deployer git -C "$repo_dir" rev-parse "refs/remotes/origin/$branch")
if [[ ! "$remote_commit" =~ ^[0-9a-f]{40}$ ]]; then
    log "invalid remote commit: $remote_commit"
    exit 1
fi

deployed_commit=""
if [[ -f "$deployed_commit_file" ]]; then
    deployed_commit=$(<"$deployed_commit_file")
fi

if [[ "$deployed_commit" == "$remote_commit" ]] && \
    [[ -f "$current_link/.git-commit" ]] && \
    [[ "$(<"$current_link/.git-commit")" == "$remote_commit" ]]; then
    if wait_for_local_health; then
        log "no changes: ${remote_commit:0:12} is already healthy"
        exit 0
    fi

    log "current commit matches but health check failed"
    exit 1
fi

work_dir=$(run_as_deployer mktemp -d "$work_root/deploy.XXXXXX")
log "preparing ${remote_commit:0:12}"
run_as_deployer bash -c '
    set -euo pipefail
    git -C "$1" archive "$2" | tar -x -C "$3"
' _ "$repo_dir" "$remote_commit" "$work_dir"

log "installing dependencies"
run_as_deployer npm --prefix "$work_dir" ci --no-audit --no-fund

log "running release gates"
run_as_deployer npm --prefix "$work_dir" run lint
run_as_deployer npm --prefix "$work_dir" test
run_as_deployer npm --prefix "$work_dir" run typecheck
run_as_deployer npm --prefix "$work_dir" run build

test -f "$work_dir/dist/index.html"
test -f "$work_dir/server/index.mjs"

release_id="$(date -u +%Y%m%dT%H%M%SZ)-${remote_commit:0:12}"
release_dir="$release_root/$release_id"
if [[ -e "$release_dir" ]]; then
    log "release already exists: $release_dir"
    exit 1
fi

install -d -o root -g root -m 0755 "$release_dir"
cp -a "$work_dir/dist" "$release_dir/dist"
cp -a "$work_dir/functions" "$release_dir/functions"
cp -a "$work_dir/server" "$release_dir/server"
install -o root -g root -m 0644 "$work_dir/package.json" "$release_dir/package.json"
if [[ -f "$work_dir/package-lock.json" ]]; then
    install -o root -g root -m 0644 \
        "$work_dir/package-lock.json" "$release_dir/package-lock.json"
fi
printf '%s\n' "$remote_commit" >"$release_dir/.git-commit"
date -u +%Y-%m-%dT%H:%M:%SZ >"$release_dir/.deployed-at"
chown -R root:root "$release_dir"

previous_target=$(readlink -f "$current_link" || true)
log "activating $release_dir"
ln -sfn "$release_dir" "$current_link.next"
mv -Tf "$current_link.next" "$current_link"

if ! systemctl restart "$service_name" || ! wait_for_local_health; then
    rollback "$previous_target"
    exit 1
fi

state_tmp=$(mktemp "$state_root/deployed-commit.XXXXXX")
printf '%s\n' "$remote_commit" >"$state_tmp"
chmod 0644 "$state_tmp"
mv -f "$state_tmp" "$deployed_commit_file"

if curl --fail --silent --show-error --max-time 15 \
    https://jumaomaomaoju.cn/healthz >/dev/null; then
    log "public health check passed"
else
    log "warning: local health passed but public health check failed"
fi

log "deployed ${remote_commit:0:12} to $release_dir"

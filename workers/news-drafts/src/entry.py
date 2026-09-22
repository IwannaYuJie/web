"""Cloudflare Python Worker and durable Workflow entrypoints."""

import hmac
import json
from datetime import datetime, timezone
from urllib.parse import urlsplit
from uuid import uuid4

from js import AbortSignal, JSON, Object, fetch
from pyodide.ffi import to_js
from workers import Response, WorkerEntrypoint, WorkflowEntrypoint
from workers.workflows import NonRetryableError

from news import (
    MAX_FEED_BYTES, SOURCES, extract_model_text, make_draft,
    model_messages, parse_date, parse_feed, select_entries,
)

MODEL = "@cf/qwen/qwen3-30b-a3b-fp8"
READ_RETRIES = {"retries": {"limit": 2, "delay": "5 seconds", "backoff": "exponential"}, "timeout": "45 seconds"}
WRITE_RETRIES = {"retries": {"limit": 3, "delay": "5 seconds", "backoff": "exponential"}, "timeout": "45 seconds"}
AI_ONCE = {"retries": {"limit": 0, "delay": "1 second"}, "timeout": "3 minutes"}


def js_object(value):
    return to_js(value, dict_converter=Object.fromEntries)


def from_js(value):
    if isinstance(value, dict):
        return value
    return json.loads(str(JSON.stringify(value)))


def configured(env):
    token = getattr(env, "NEWS_COLLECTOR_TOKEN", None)
    origin = str(getattr(env, "BLOG_ORIGIN", "" )).rstrip("/")
    if not token or len(str(token)) < 32 or origin != "https://jumaomaomaoju.cn":
        raise ValueError("Collector configuration is incomplete")
    return str(token), origin


async def read_limited(response, limit):
    advertised = response.headers.get("Content-Length")
    if advertised and int(advertised) > limit:
        if response.body:
            await response.body.cancel()
        raise ValueError("Response exceeds the size limit")
    reader = response.body.getReader()
    chunks = []
    total = 0
    try:
        while True:
            part = await reader.read()
            if part.done:
                break
            chunk = bytes(part.value.to_py())
            total += len(chunk)
            if total > limit:
                await reader.cancel()
                raise ValueError("Response exceeds the size limit")
            chunks.append(chunk)
    finally:
        reader.releaseLock()
    return b"".join(chunks)


async def api(env, action, payload):
    token, origin = configured(env)
    response = await fetch(origin + "/api/news-drafts/collector/" + action, js_object({
        "method": "POST", "redirect": "manual",
        "headers": {"Authorization": "Bearer " + token, "Content-Type": "application/json"},
        "body": json.dumps(payload, ensure_ascii=False),
        "signal": AbortSignal.timeout(25_000),
    }))
    status = int(response.status)
    if action == "start" and status in (409, 429):
        await response.body.cancel()
        return {"skip": "already-running" if status == 409 else "daily-limit"}
    if status < 200 or status >= 300:
        await response.body.cancel()
        message = "Blog collector " + action + " returned HTTP " + str(status)
        if 400 <= status < 500 and status != 429:
            raise NonRetryableError(message)
        raise RuntimeError(message)
    raw = await read_limited(response, 1024 * 1024)
    value = json.loads(raw)
    if not isinstance(value, dict):
        raise ValueError("Invalid blog collector response")
    return value


async def fetch_source(source, now):
    # URLs are fixed in code; neither RSS articles nor model output are fetched.
    response = await fetch(source["feed"], js_object({
        "redirect": "manual",
        "headers": {"Accept": "application/rss+xml, application/xml, text/xml", "User-Agent": "OrangeCatNewsDrafts/1.0"},
        "signal": AbortSignal.timeout(25_000),
    }))
    if int(response.status) != 200:
        await response.body.cancel()
        raise RuntimeError(source["name"] + " RSS returned HTTP " + str(response.status))
    raw = await read_limited(response, MAX_FEED_BYTES)
    try:
        return parse_feed(raw, source, now)
    except Exception:
        raise NonRetryableError(source["name"] + " RSS failed validation") from None


class NewsDraftWorkflow(WorkflowEntrypoint):
    async def run(self, event, step):
        run_id = event["instanceId"]
        params = event.get("payload") or {}
        now = parse_date(params["createdAt"])
        model = str(getattr(self.env, "AI_MODEL", MODEL))
        # Restrict models so an accidental configuration edit cannot invoke a
        # partner provider or introduce a second paid inference route.
        if model != MODEL:
            raise ValueError("Unsupported collector AI model")
        created, skipped = 0, 0
        errors = []

        @step.do("collector-start", config=WRITE_RETRIES)
        async def start():
            return await api(self.env, "start", {"runId": run_id, "trigger": params.get("trigger", "manual")})

        try:
            state = await start()
            if state.get("skip") or state.get("finished"):
                return state
            if state.get("runId") != run_id:
                raise ValueError("Blog returned a different collector run ID")
            remaining = min(3, max(0, int(state["remaining"])))
            entries = []
            for source in SOURCES:
                @step.do("rss-" + source["id"], config=READ_RETRIES)
                async def load_source():
                    return await fetch_source(source, now)

                try:
                    feed = await load_source()
                    entries.extend(feed["entries"])
                    skipped += feed["skipped"]
                except Exception:
                    errors.append(source["name"] + " RSS 获取或校验失败")

            selected = select_entries(entries, state.get("seenUrls", []), remaining)
            skipped += max(0, len(entries) - len(selected))
            for index, entry in enumerate(selected):
                @step.do("summarize-" + str(index), config=AI_ONCE)
                async def summarize():
                    result = await self.env.AI.run(model, js_object({
                        "messages": model_messages(entry),
                        "response_format": {"type": "json_object"},
                        "max_tokens": 1800, "temperature": 0.1,
                    }))
                    return make_draft(entry, extract_model_text(from_js(result)), run_id, model)

                @step.do("ingest-" + str(index), config=WRITE_RETRIES)
                async def ingest():
                    return await api(self.env, "ingest", draft)

                try:
                    # The inference result is durable before the idempotent write.
                    draft = await summarize()
                    result = await ingest()
                    if result.get("created") or result.get("alreadyCreatedForRun"):
                        created += 1
                    else:
                        skipped += 1
                except Exception:
                    skipped += 1
                    errors.append(entry["sourceName"] + " 草稿整理或保存失败")
        except Exception:
            errors.append("资讯采集执行失败，请检查 Workflow 日志和采集服务状态")

        outcome = {
            "runId": run_id, "status": "error" if errors else "success",
            "created": created, "skipped": skipped,
            "error": "；".join(errors)[:500] if errors else "",
        }

        @step.do("collector-finish", config=WRITE_RETRIES)
        async def finish():
            return await api(self.env, "finish", outcome)

        # Failure here remains an errored durable Workflow; it is never silently
        # reported as success, and the server can recover its expiring run lock.
        await finish()
        return outcome


async def create_workflow(env, trigger, workflow_id=None):
    configured(env)
    run_id = workflow_id or "manual-" + str(uuid4())
    instance = await env.NEWS_WORKFLOW.create(js_object({
        "id": run_id,
        "params": {"trigger": trigger, "createdAt": datetime.now(timezone.utc).isoformat()},
    }))
    return {"accepted": True, "runId": str(instance.id), "status": "queued"}


class Default(WorkerEntrypoint):
    async def fetch(self, request):
        path = urlsplit(request.url).path
        if path == "/healthz" and request.method == "GET":
            return Response.json({"ok": True, "service": "orange-cat-news-drafts"})
        if path != "/run":
            return Response.json({"error": "Not found"}, status=404)
        if request.method != "POST":
            return Response.json({"error": "Method not allowed"}, status=405, headers={"Allow": "POST"})
        try:
            token, _ = configured(self.env)
        except ValueError:
            return Response.json({"error": "Collector is not configured"}, status=503)
        authorization = request.headers.get("Authorization") or ""
        if not hmac.compare_digest(authorization.encode("utf-8"), ("Bearer " + token).encode("utf-8")):
            return Response.json({"error": "Unauthorized"}, status=401)
        try:
            result = await create_workflow(self.env, "manual")
        except Exception:
            return Response.json({"error": "Failed to queue collector Workflow"}, status=503)
        return Response.json(result, status=202, headers={"Cache-Control": "no-store"})

    async def scheduled(self, controller):
        scheduled_time = getattr(controller, "scheduledTime", None)
        instant = (datetime.fromtimestamp(scheduled_time / 1000, timezone.utc)
                   if isinstance(scheduled_time, (int, float))
                   else datetime.now(timezone.utc))
        day = instant.date().isoformat()
        # A scheduled event retry refers to the same Workflow, never a second run.
        run_id = "scheduled-" + day
        try:
            await create_workflow(self.env, "scheduled", run_id)
        except Exception:
            # Existing IDs are a successful duplicate delivery. A real create
            # failure also fails get/status and propagates to scheduled-event logs.
            instance = await self.env.NEWS_WORKFLOW.get(run_id)
            await instance.status()

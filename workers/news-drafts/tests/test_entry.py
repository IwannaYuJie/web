"""Exercise trigger security and orchestration with network/binding boundaries mocked."""

import importlib.util
import json
import sys
import types
import unittest
from pathlib import Path
from unittest.mock import AsyncMock, patch

from test_news import CF, NOW, feed, item, model_result
from news import parse_feed


class FakeResponse:
    @staticmethod
    def json(data, status=200, headers=None):
        return types.SimpleNamespace(data=data, status=status, headers=headers or {})


class Entrypoint:
    def __init__(self, env):
        self.env = env


def load_entry():
    modules = {
        "js": types.SimpleNamespace(AbortSignal=types.SimpleNamespace(timeout=lambda value: value),
                                    JSON=types.SimpleNamespace(stringify=json.dumps),
                                    Object=types.SimpleNamespace(fromEntries=dict), fetch=AsyncMock()),
        "pyodide.ffi": types.SimpleNamespace(to_js=lambda value, **kwargs: value),
        "workers": types.SimpleNamespace(Response=FakeResponse, WorkerEntrypoint=Entrypoint, WorkflowEntrypoint=Entrypoint),
        "workers.workflows": types.SimpleNamespace(NonRetryableError=type("NonRetryableError", (Exception,), {})),
    }
    spec = importlib.util.spec_from_file_location("collector_test_entry", Path(__file__).resolve().parents[1] / "src/entry.py")
    module = importlib.util.module_from_spec(spec)
    with patch.dict(sys.modules, modules):
        spec.loader.exec_module(module)
    return module


entry = load_entry()


class Steps:
    def __init__(self):
        self.names = []
        self.configs = {}

    def do(self, name, config):
        self.configs[name] = config
        def decorator(fn):
            async def wrapped():
                self.names.append(name)
                return await fn()
            return wrapped
        return decorator


def environment():
    return types.SimpleNamespace(
        NEWS_COLLECTOR_TOKEN="x" * 40, BLOG_ORIGIN="https://jumaomaomaoju.cn", AI_MODEL=entry.MODEL,
        NEWS_WORKFLOW=types.SimpleNamespace(create=AsyncMock(return_value=types.SimpleNamespace(id="workflow-123"))),
        AI=types.SimpleNamespace(run=AsyncMock(return_value={"response": model_result()})),
    )


class TriggerTests(unittest.IsolatedAsyncioTestCase):
    async def test_authentication_and_method_do_not_create_workflows(self):
        env = environment()
        worker = entry.Default(env)
        for method, headers, expected in (("GET", {}, 405), ("POST", {}, 401),
                                           ("POST", {"Authorization": "Bearer wrong"}, 401)):
            result = await worker.fetch(types.SimpleNamespace(url="https://worker.test/run", method=method, headers=headers))
            self.assertEqual(result.status, expected)
        env.NEWS_WORKFLOW.create.assert_not_awaited()

    async def test_authorized_trigger_queues_without_running_ai(self):
        env = environment()
        request = types.SimpleNamespace(url="https://worker.test/run", method="POST", headers={"Authorization": "Bearer " + env.NEWS_COLLECTOR_TOKEN})
        result = await entry.Default(env).fetch(request)
        self.assertEqual(result.status, 202)
        self.assertTrue(result.data["accepted"])
        env.NEWS_WORKFLOW.create.assert_awaited_once()
        env.AI.run.assert_not_awaited()

    async def test_creation_failure_is_not_accepted(self):
        env = environment()
        env.NEWS_WORKFLOW.create.side_effect = RuntimeError("network")
        request = types.SimpleNamespace(url="https://worker.test/run", method="POST", headers={"Authorization": "Bearer " + env.NEWS_COLLECTOR_TOKEN})
        result = await entry.Default(env).fetch(request)
        self.assertEqual(result.status, 503)

    async def test_scheduled_id_uses_original_event_date_on_retry(self):
        env = environment()
        await entry.Default(env).scheduled(types.SimpleNamespace(scheduledTime=NOW.timestamp() * 1000))
        options = env.NEWS_WORKFLOW.create.await_args.args[0]
        self.assertEqual(options["id"], "scheduled-2026-09-22")

    async def test_duplicate_scheduled_delivery_reuses_existing_workflow(self):
        env = environment()
        env.NEWS_WORKFLOW.create.side_effect = RuntimeError("ID already exists")
        status = AsyncMock(return_value={"status": "complete"})
        env.NEWS_WORKFLOW.get = AsyncMock(return_value=types.SimpleNamespace(status=status))
        await entry.Default(env).scheduled(types.SimpleNamespace(scheduledTime=NOW.timestamp() * 1000))
        env.NEWS_WORKFLOW.get.assert_awaited_once_with("scheduled-2026-09-22")
        status.assert_awaited_once()


class WorkflowTests(unittest.IsolatedAsyncioTestCase):
    async def run_workflow(self, api_mock, env=None, feed_mock=None):
        env = env or environment()
        steps = Steps()
        rows = parse_feed(feed(item()), CF, NOW)
        feed_mock = feed_mock or AsyncMock(side_effect=[rows, {"entries": [], "skipped": 0}])
        with patch.object(entry, "api", api_mock), patch.object(entry, "fetch_source", feed_mock):
            result = await entry.NewsDraftWorkflow(env).run({"instanceId": "run-123", "payload": {"createdAt": NOW.isoformat(), "trigger": "manual"}}, steps)
        return result, env, steps

    async def test_durable_inference_then_ingest_then_finish(self):
        api_mock = AsyncMock(side_effect=[{"runId": "run-123", "remaining": 3, "seenUrls": []}, {"created": True}, {}])
        result, env, steps = await self.run_workflow(api_mock)
        self.assertEqual((result["status"], result["created"]), ("success", 1))
        self.assertEqual(steps.names, ["collector-start", "rss-cloudflare", "rss-openai", "summarize-0", "ingest-0", "collector-finish"])
        self.assertEqual(steps.configs["summarize-0"]["retries"]["limit"], 0)
        draft = api_mock.await_args_list[1].args[2]
        self.assertEqual(draft["sourceId"], "cloudflare")
        self.assertEqual(draft["sourceUrl"], "https://blog.cloudflare.com/python-workers-ga/")
        env.AI.run.assert_awaited_once()

    async def test_model_invalid_json_is_finished_as_error_without_ingest(self):
        env = environment()
        env.AI.run.return_value = {"response": "invalid JSON"}
        api_mock = AsyncMock(side_effect=[{"runId": "run-123", "remaining": 3, "seenUrls": []}, {}])
        result, _, _ = await self.run_workflow(api_mock, env)
        self.assertEqual(result["status"], "error")
        self.assertEqual(result["created"], 0)
        self.assertEqual([call.args[1] for call in api_mock.await_args_list], ["start", "finish"])

    async def test_existing_run_and_daily_limit_do_not_call_ai_or_finish_other_run(self):
        for state in ({"skip": "already-running"}, {"skip": "daily-limit"}, {"finished": True}):
            api_mock = AsyncMock(return_value=state)
            result, env, steps = await self.run_workflow(api_mock)
            self.assertEqual(result, state)
            self.assertEqual(steps.names, ["collector-start"])
            env.AI.run.assert_not_awaited()

    async def test_ingest_response_loss_replay_is_counted_once(self):
        api_mock = AsyncMock(side_effect=[{"runId": "run-123", "remaining": 3, "seenUrls": []},
                                         {"created": False, "alreadyCreatedForRun": True}, {}])
        result, _, _ = await self.run_workflow(api_mock)
        self.assertEqual(result["created"], 1)

    async def test_one_feed_failure_is_visible_while_other_can_be_saved(self):
        rows = parse_feed(feed(item()), CF, NOW)
        api_mock = AsyncMock(side_effect=[{"runId": "run-123", "remaining": 3, "seenUrls": []}, {"created": True}, {}])
        result, _, _ = await self.run_workflow(api_mock, feed_mock=AsyncMock(side_effect=[rows, RuntimeError("feed down")]))
        self.assertEqual((result["status"], result["created"]), ("error", 1))
        self.assertIn("OpenAI News", result["error"])


if __name__ == "__main__":
    unittest.main()

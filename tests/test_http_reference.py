from __future__ import annotations

import json
import sys
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "reference/python"))

from musttip_notifications import NotificationsClient, SdkConfig  # noqa: E402


class _Handler(BaseHTTPRequestHandler):
    attempts = 0
    received: list[dict[str, object]] = []

    def log_message(self, format: str, *args: object) -> None:  # noqa: A003
        return

    def do_POST(self) -> None:  # noqa: N802
        type(self).attempts += 1
        length = int(self.headers.get("Content-Length", "0"))
        body = self.rfile.read(length)
        type(self).received.append({
            "path": self.path,
            "idempotency": self.headers.get("Idempotency-Key"),
            "authorization": self.headers.get("Authorization"),
            "body": json.loads(body),
        })
        if type(self).attempts == 1:
            self.send_response(503)
            self.send_header("Content-Type", "application/json")
            self.send_header("Retry-After", "0")
            self.end_headers()
            self.wfile.write(b'{"detail":"retry"}')
            return
        self.send_response(202)
        self.send_header("Content-Type", "application/json")
        self.send_header("X-Request-ID", "req-server-1")
        self.end_headers()
        self.wfile.write(b'{"status":"accepted","task_id":"task-1"}')


def test_idempotent_mutation_retries_with_same_key() -> None:
    _Handler.attempts = 0
    _Handler.received = []
    server = ThreadingHTTPServer(("127.0.0.1", 0), _Handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        client = NotificationsClient(SdkConfig(
            base_url=f"http://127.0.0.1:{server.server_port}/api/v1/external/notifications",
            access_token="header.payload.signature",
            base_retry_delay_seconds=0.0,
            maximum_retry_delay_seconds=0.0,
        ))
        response = client.create_notification(
            {"recipient_identifier": "customer-1", "notification_type": "test"},
            idempotency_key="business-key-1",
        )
        assert response.status_code == 202
        assert response.request_id == "req-server-1"
        assert _Handler.attempts == 2
        assert [item["idempotency"] for item in _Handler.received] == ["business-key-1", "business-key-1"]
        assert all(item["authorization"] == "Bearer header.payload.signature" for item in _Handler.received)
    finally:
        server.shutdown()
        server.server_close()

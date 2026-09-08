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


def test_sdk_rejects_tenant_authority_overrides_and_protected_headers() -> None:
    from musttip_notifications import ConfigurationError, ProtocolError

    with __import__("pytest").raises(ConfigurationError):
        SdkConfig(
            base_url="https://notifications.example.test/api/v1/external/notifications",
            access_token="token",
            default_headers={"X-Tenant-ID": "forged-tenant"},
        )

    client = NotificationsClient(SdkConfig(
        base_url="http://127.0.0.1:8000/api/v1/external/notifications",
        access_token="token",
    ))
    with __import__("pytest").raises(ProtocolError):
        client.call_operation("listNotifications", query={"tenant_id": "forged"})
    with __import__("pytest").raises(ProtocolError):
        client.call_operation("createNotification", body={"tenant_id": "forged"}, idempotency_key="safe-key")
    with __import__("pytest").raises(ConfigurationError):
        client.call_operation("listNotifications", headers={"Authorization": "Bearer forged"})


def test_tls_verification_cannot_be_disabled_for_remote_hosts() -> None:
    from musttip_notifications import ConfigurationError
    import pytest

    with pytest.raises(ConfigurationError):
        SdkConfig(base_url="https://notifications.example.test", access_token="token", verify_tls=False)


def test_group_slug_validation_is_fail_closed() -> None:
    from musttip_notifications import ProtocolError
    import pytest

    client = NotificationsClient(SdkConfig(base_url="http://127.0.0.1:8000", access_token="token"))
    with pytest.raises(ProtocolError):
        client.list_group_notifications("../banking")


def test_scoped_clients_pin_application_and_recipient() -> None:
    client = NotificationsClient(SdkConfig(base_url="http://127.0.0.1:8000", access_token="token"))
    application = client.for_application("commerce-app")
    user = application.for_user("customer-123")
    assert application.application_id == "commerce-app"
    assert user.application_id == "commerce-app"
    assert user.recipient_identifier == "customer-123"

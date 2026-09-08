"""Real HTTP boundary tests; the OAuth verifier is replaced by a controlled fixture."""
from __future__ import annotations

import re
import sys
import threading
from pathlib import Path
from wsgiref.simple_server import WSGIRequestHandler, make_server

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'reference/python'))
from musttip_notifications import AuthenticationError, NotificationsClient, SdkConfig
from musttip_notifications.catalog import OPERATIONS


def test_every_sdk_operation_resolves_to_a_backend_method():
    from django.urls import resolve
    for operation in OPERATIONS.values():
        route = re.sub(r'\{[^}]+\}', '11111111-1111-4111-8111-111111111111', operation.path)
        match = resolve('/api/v1/external/notifications' + route)
        assert hasattr(match.func.view_class, operation.method.lower()), operation.operation_id


@pytest.mark.django_db(transaction=True)
def test_sdk_connects_to_backend_over_http(monkeypatch, settings):
    from django.core.wsgi import get_wsgi_application
    from external_notifications import authentication, permissions
    from external_notifications.tests.test_principal import Remote

    settings.ALLOWED_HOSTS = ['127.0.0.1']
    settings.MIDDLEWARE = []
    authentication.reset_external_authentication_caches()
    def verify(request, token):
        if token != 'verified-test-token':
            raise ValueError('invalid token')
        return Remote()
    monkeypatch.setattr(authentication, '_resolver', lambda path: verify)
    monkeypatch.setattr(permissions, '_authorizer', lambda path: lambda user, permission, **kwargs: permission in user.claims['permissions'])
    class QuietHandler(WSGIRequestHandler):
        def log_message(self, *args):
            pass
    server = make_server('127.0.0.1', 0, get_wsgi_application(), handler_class=QuietHandler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        url = f'http://127.0.0.1:{server.server_port}/api/v1/external/notifications'
        client = NotificationsClient(SdkConfig(base_url=url, access_token='verified-test-token'))
        response = client.capabilities()
        assert response.status_code == 200
        assert response.data['tenant_id'] == 'tenant-acme'
        assert response.data['application_id'] == 'app-commerce'
        invalid = NotificationsClient(SdkConfig(base_url=url, access_token='invalid'))
        with pytest.raises(AuthenticationError):
            invalid.capabilities()
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=5)
        authentication._settings.cache_clear()

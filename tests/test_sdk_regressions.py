from __future__ import annotations

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'reference/python'))
from musttip_notifications import ConfigurationError, NotificationsClient, ProtocolError, SdkConfig
from musttip_notifications.jsonutil import loads_strict


@pytest.mark.parametrize('field,value', [
    ('maximum_attempts', 1.5), ('maximum_attempts', True),
    ('maximum_response_bytes', '4096'), ('maximum_request_bytes', 1024.5),
    ('timeout_seconds', '10'), ('timeout_seconds', float('nan')),
    ('verify_tls', 'false'), ('base_url', 'https://example.test:wrong'),
    ('base_url', 'https://example.test\n'),
])
def test_invalid_configuration_fails_before_transport(field, value):
    args = dict(base_url='https://example.test', access_token='token')
    args[field] = value
    with pytest.raises(ConfigurationError):
        SdkConfig(**args)


def test_header_configuration_is_an_immutable_snapshot():
    headers = {'X-Correlation-ID': 'safe'}
    config = SdkConfig(base_url='https://example.test', access_token='token', default_headers=headers)
    headers['Authorization'] = 'Bearer forged'
    assert 'Authorization' not in config.default_headers
    with pytest.raises(TypeError):
        config.default_headers['Host'] = 'forged'


@pytest.mark.parametrize('token', ['bad\x00token', 'bad\x7ftoken', 123])
def test_invalid_provider_tokens_are_rejected(token):
    config = SdkConfig(base_url='https://example.test', access_token=lambda: token)
    with pytest.raises(ConfigurationError):
        config.resolve_token()


@pytest.mark.parametrize('value', [True, 1.5, '2', -1])
def test_preconditions_require_integer_versions(value):
    client = NotificationsClient(SdkConfig(base_url='https://example.test', access_token='token'))
    with pytest.raises(ProtocolError):
        client.call_operation('listNotifications', expected_version=value)


@pytest.mark.parametrize('raw', [b'1e999', b'[' * 2000 + b']' * 2000], ids=['overflow', 'depth'])
def test_malformed_response_numbers_and_depth_raise_sdk_error(raw):
    with pytest.raises(ProtocolError):
        loads_strict(raw, maximum_bytes=8192)


@pytest.mark.parametrize('segment', ['.', '..'])
def test_dot_segments_cannot_escape_operation_routes(segment):
    client = NotificationsClient(SdkConfig(base_url='https://example.test', access_token='token'))
    with pytest.raises(ProtocolError):
        client.get_notification(segment)


def test_config_repr_does_not_expose_bearer_token():
    assert 'secret-bearer-token' not in repr(SdkConfig(base_url='https://example.test', access_token='secret-bearer-token'))


def test_non_ascii_signature_raises_protocol_error():
    from musttip_notifications import verify_event_payload
    with pytest.raises(ProtocolError):
        verify_event_payload(b'{}', {'signature': 'é' * 43, 'signature-key-id': 'key'}, secrets={'key': 's' * 32})

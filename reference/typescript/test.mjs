import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { webcrypto } from 'node:crypto';
import { NotificationsClient, ConfigurationError, ProtocolError, AuthenticationError, signEventPayload, verifyEventPayload } from './dist/index.js';
globalThis.crypto ??= webcrypto;
const config = {baseUrl:'https://example.test', accessToken:'token', maximumAttempts:1};

test('rejects fractional limits and accepts IPv6 loopback', () => {
  assert.throws(() => new NotificationsClient({...config, maximumAttempts:1.5}), ConfigurationError);
  new NotificationsClient({...config, baseUrl:'http://[::1]:8000'});
});
test('snapshots protected headers', async () => {
  const headers = {'X-Correlation-ID':'safe'};
  const client = new NotificationsClient({...config, defaultHeaders:headers, fetchImpl:async (url, request) => {
    assert.equal(request.headers.Authorization, 'Bearer token');
    return new Response('{}');
  }});
  headers.Authorization = 'Bearer forged';
  await client.capabilities();
});
test('cancels oversized streaming responses before buffering', async () => {
  let cancelled = false;
  const stream = new ReadableStream({pull(c) { c.enqueue(new Uint8Array(4097)); }, cancel() { cancelled = true; }});
  const client = new NotificationsClient({...config, maximumResponseBytes:4096, fetchImpl:async () => new Response(stream)});
  await assert.rejects(client.capabilities(), ProtocolError);
  assert.equal(cancelled, true);
});
test('retries HTML gateway failures with a stable idempotency key', async () => {
  const keys = [];
  const client = new NotificationsClient({...config, maximumAttempts:2, baseRetryDelayMs:0, maximumRetryDelayMs:0, fetchImpl:async (url, request) => {
    keys.push(request.headers['Idempotency-Key']);
    return keys.length === 1 ? new Response('<html>unavailable</html>', {status:503}) : new Response('{}', {status:202});
  }});
  await client.createNotification({}, 'business-key');
  assert.deepEqual(keys, ['business-key','business-key']);
});
test('classifies non-JSON authentication errors', async () => {
  const client = new NotificationsClient({...config, fetchImpl:async () => new Response('unauthorized',{status:401})});
  await assert.rejects(client.capabilities(), AuthenticationError);
});
test('rejects token controls and dot path segments', async () => {
  await assert.rejects(new NotificationsClient({...config, accessToken:'bad\0token'}).capabilities(), ConfigurationError);
  await assert.rejects(new NotificationsClient(config).getNotification('..'), ProtocolError);
});
test('event signatures match the shared backend vector', async () => {
  const vector = JSON.parse(readFileSync(new URL('../../conformance/fixtures/event-signature-vector.json',import.meta.url)));
  const payload = new TextEncoder().encode(vector.payload_utf8);
  assert.deepEqual(await signEventPayload(payload, vector.secret, vector.key_id), vector.headers);
  assert.equal(await verifyEventPayload(payload, vector.headers, {[vector.key_id]:vector.secret}), true);
  await assert.rejects(verifyEventPayload(new Uint8Array([1]), vector.headers, {[vector.key_id]:vector.secret}), ProtocolError);
});

# Testing generated and reference SDKs

Every language SDK should test:

- exact base-path and URL encoding;
- all operation IDs map to the correct method/path;
- bearer tokens never enter query strings or logs;
- all required mutations reject missing idempotency keys;
- the same idempotency key is retained across retries;
- retry status and `Retry-After` behaviour;
- response-size and malformed-JSON rejection;
- API error mapping and request-ID capture;
- public UUID handling;
- realtime protocol version and subprotocols;
- recipient ticket formatting;
- event HMAC test vectors;
- tenant/application fields cannot be injected as authority;
- secret-field redaction.

Run integration tests against development or staging, never production test recipients, using dedicated tenant/application credentials and provider sandboxes.

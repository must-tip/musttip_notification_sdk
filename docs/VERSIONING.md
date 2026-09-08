# Versioning and compatibility

REST v1 lives only at `/api/v1/external/notifications/`. Realtime v1 is versioned by URL, WebSocket subprotocol and JSON `protocol_version`.

Additive optional fields and endpoints may be introduced in v1 when existing meaning, authorization, status codes and idempotency remain unchanged. Removing fields, changing enum meaning, changing ownership rules, changing idempotency behaviour or reinterpreting status codes requires v2.

Generated SDK packages should use semantic versions independently from the server contract:

- patch: SDK bugfix with unchanged wire behaviour;
- minor: additive helper or newly supported v1 operation;
- major: SDK API break or new server contract generation.

Pin the OpenAPI/AsyncAPI contract checksum in CI and regenerate clients deliberately.

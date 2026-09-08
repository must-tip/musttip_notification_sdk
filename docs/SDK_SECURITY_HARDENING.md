# SDK security hardening — 1.1.0

This release aligns the SDK with the notification service's tenant/application/group/user separation.

Key controls:

- tenant authority cannot be supplied through SDK input;
- protected headers cannot override OAuth or tenant/application authority;
- application targeting is path-scoped and server-authorized;
- user-owned CRUD helpers bind `recipient_identifier` in the route;
- grouped notification helpers validate group slugs;
- `notifications.delete` is represented in scopes and operation contracts;
- HTTP redirects are rejected by reference transports;
- non-local TLS verification cannot be disabled by the Python client;
- requests and responses are size bounded;
- retry behavior remains limited to safe methods or idempotency-key mutations;
- unexpected success statuses are treated as protocol drift;
- `204 No Content` is accepted without JSON parsing;
- machine-readable SDK artifacts are validated for syntax and cross-contract consistency.

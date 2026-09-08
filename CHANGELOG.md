# Changelog

## 1.0.0

- Initial contract-first SDK bundle.
- REST v1 operation catalogue covering all 42 external notification operations.
- Realtime v1 contract for internal recipients, developer monitoring and external recipients.
- OpenAPI Generator profiles for eleven language targets.
- Python and TypeScript reference clients.
- Signed event verification, fixtures, conformance tests, Postman collection and backend examples.

## 1.1.0 — tenant-safe notification SDK alignment

- synchronized REST contract with the notification service's 53-operation external API;
- added application-scoped, user-owned and grouped notification helpers;
- added owned notification deletion and `notifications.delete` scope;
- prohibited tenant-authority inputs and protected-header overrides;
- rejected redirects and strengthened TLS, size, retry and protocol-status handling;
- repaired invalid `sdk-manifest.json` packaging;
- restored the canonical root `generator/` directory expected by conformance tests;
- added cross-contract, packaging and transport security regression tests.

### Verification fixes (2026-09-08)

- Reject invalid runtime limits, token controls, fractional preconditions, and dot path segments.
- Snapshot default headers and omit bearer tokens from Python configuration repr.
- Bound TypeScript response streams before buffering; retry non-JSON gateway errors.
- Normalize SDK error handling for malformed JSON and signatures; fix Python and TypeScript types.
- Add backend route and HTTP connection tests, reproducible development dependencies,
  TypeScript lockfile/runtime tests, and npm NOTICE packaging.

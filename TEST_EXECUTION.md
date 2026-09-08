# Verification — 2026-09-08

Executed against the sibling notification backend and Python 3.12 environment:

- Combined SDK/backend pytest: 630 passed, 5 deployment-dependent skips.
- SDK Python suite: 47 tests (included in combined count).
- TypeScript 5.9.3 strict compilation and 7 Node runtime regression tests pass.
- Python mypy: SDK 10 files and backend 341 files pass.
- Ruff checks pass; Bandit finds no unsuppressed medium/high findings.
  The explicit loopback-only TLS verification opt-out has a documented exception.
- Contract conformance: 53 operations; all resolve to matching backend HTTP methods.
- Real loopback HTTP SDK-to-Django capabilities and authentication rejection pass.
  OAuth verification and policy authorization are controlled test fixtures.
- Python wheel and npm tarball rebuilt; installed wheel imports its 53-operation catalog.
- Dependency consistency passes; Django reports no migration drift.

Production approval remains blocked: the local deployment check cannot read the
configured authentication CA bundle. Test settings intentionally disable deployment
TLS/cookie enforcement and brokers. The deployed notification task handler, real
OAuth/mTLS service, PostgreSQL, Kafka/NATS, WebSocket delivery, and notification
providers still need staging validation. Passing local tests is not proof that the
complete deployed system is production-ready or bug-free.

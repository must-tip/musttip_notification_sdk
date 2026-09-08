# Language support

The notification SDK is language-agnostic because the wire contracts use standard technologies:

- HTTPS and JSON for REST;
- OAuth 2.0 bearer access tokens;
- WebSocket and JSON for realtime;
- JSON Schema for validation;
- HMAC-SHA256 with base64url for event signatures;
- OpenAPI and AsyncAPI for client generation.

Any language with HTTP, JSON and cryptographic libraries can integrate without a proprietary runtime.

| Ecosystem | Included support |
|---|---|
| Python | Generator profile, dependency-free reference client and example |
| TypeScript/JavaScript | Fetch generator profile, reference client, Node/browser-compatible protocol helpers and example |
| Go | Generator profile and standard-library example |
| Java | Generator profile and Java `HttpClient` example |
| C#/.NET | Generator profile and `HttpClient` example |
| PHP | Generator profile and cURL example |
| Ruby | Generator profile and `Net::HTTP` example |
| Kotlin | Generator profile and JVM example |
| Swift | Generator profile and `URLSession` example |
| Rust | Generator profile; use the generated `reqwest` client |
| Dart/Flutter | Dio generator profile; use recipient tickets for frontend realtime |
| Other languages | Implement `contract/operations.json`, OpenAPI and AsyncAPI directly |

Generated clients are optional. A backend can use its native HTTP client as long as it preserves authentication, idempotency, retry, versioning, size limits, public identifiers and error semantics.

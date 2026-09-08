# Kafka, NATS and signed events

The existing communication architecture serialises an `EventEnvelope`, adds transport headers and optionally signs the exact payload bytes.

## Signature algorithm

```text
HMAC-SHA256(secret UTF-8 bytes, exact payload bytes)
-> base64url without padding
```

Headers:

```text
signature
signature-key-id
```

The SDK reference clients provide compatible signing and verification helpers. Verify before JSON parsing when consuming externally supplied event bytes. Resolve the secret by key ID from Vault-backed configuration, support key rotation, and compare signatures in constant time.

## Consumer responsibilities

Use the existing `ConsumerService` for Kafka/NATS whenever integrating inside the Must Tip service ecosystem. It already owns signature verification, idempotency, retries, acknowledgements, DLQ behaviour and graceful shutdown.

External developers consuming a projected event stream should implement the same rules:

- verify signature;
- enforce maximum payload size;
- validate the event envelope schema;
- reject missing tenant/application scope;
- deduplicate by event ID within the consumer group;
- acknowledge only after successful processing;
- dead-letter deterministic failures;
- never log raw credentials or full sensitive payloads.

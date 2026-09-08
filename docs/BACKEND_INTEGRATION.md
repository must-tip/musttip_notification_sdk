# Backend integration

## Recommended architecture

```text
Developer application
  -> generated SDK or HTTP client
  -> versioned external notification API
  -> existing validation-only serializers
  -> existing task-handler boundary
  -> existing notification models and outbox
  -> existing Celery tasks and provider adapters
  -> existing Kafka/NATS communication runtime
```

The SDK is a client boundary only. It does not change delivery responsibility.

## Configuration

Keep these values in configuration, not source code:

```text
NOTIFICATION_API_BASE_URL=https://notifications.example.com/api/v1/external/notifications
NOTIFICATION_OAUTH_AUDIENCE=urn:musttip:notification-service
NOTIFICATION_OAUTH_CLIENT_ID=<vault reference or injected value>
NOTIFICATION_OAUTH_CLIENT_SECRET=<vault reference or injected value>
```

Use separate OAuth clients, credentials, templates, provider configuration and rate limits for development, staging and production.

## Request context

Send stable tracing identifiers where supported:

```text
X-Request-ID
trace_id
correlation_id
Idempotency-Key
```

Do not put secrets, access tokens, payment-card data or unnecessary personal data in metadata.

## Framework examples

- Django/FastAPI/Flask: create one SDK client per process with a thread-safe token provider.
- Node/NestJS/Express: register the SDK as a singleton service and use an async token provider.
- Spring Boot/Ktor/.NET: register a typed/singleton HTTP client; let the platform connection pool manage sockets.
- PHP/Ruby serverless: reuse clients within a warm process; do not persist tokens to shared logs or files.

## Timeouts

API timeouts should be shorter than the caller's request timeout. Notification submission is asynchronous; do not wait for channel delivery in the developer's incoming HTTP request.

## Shutdown

Close WebSocket sessions and stop event consumers gracefully. REST clients using platform-managed HTTP pools should release resources according to their language runtime.

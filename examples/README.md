# Backend examples

Each example sends the same versioned notification request using the language's standard HTTP facilities or the included reference client.

Required environment variables:

```text
NOTIFICATION_API_BASE_URL=https://notifications.example.com/api/v1/external/notifications
NOTIFICATION_ACCESS_TOKEN=<short-lived-service-token>
```

The examples deliberately do not request OAuth tokens because token endpoints and client authentication policies belong to the authentication service. Integrate your existing Vault-backed OAuth client and provide short-lived access tokens to the SDK.

Do not use these management examples in browser or mobile code. Frontends should use their own backend and the recipient realtime-ticket flow.

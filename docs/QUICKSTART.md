# Quickstart

## 1. Obtain a service access token

The developer backend should use OAuth 2.0 `client_credentials` against the existing authentication service. Request the notification audience and the minimum scopes required by the application.

```text
audience: urn:musttip:notification-service
scopes:   notifications.send notifications.read notifications.receipts.read
```

Do not embed client secrets or notification-management access tokens in browser or mobile applications.

## 2. Create a notification

```http
POST /api/v1/external/notifications/notifications/
Authorization: Bearer <short-lived-access-token>
Content-Type: application/json
Accept: application/json
Idempotency-Key: order-4738-shipped-v1

{
  "recipient_identifier": "customer-9834",
  "notification_type": "order.shipped",
  "title": "Your order has shipped",
  "message": "Order 4738 is on its way.",
  "channels": ["in_app", "push", "email"],
  "template_key": "order-shipped",
  "locale": "en-GB",
  "metadata": {
    "order_number": "4738"
  }
}
```

The server derives `tenant_id`, `application_id`, client identity and source identity from the verified token. Never send or trust those fields from application payloads.

## 3. Read status

Use the returned public UUID:

```http
GET /api/v1/external/notifications/notifications/{public_id}/
Authorization: Bearer <access-token>
Accept: application/json
```

Use attempts and receipts for delivery diagnostics without exposing provider secrets:

```text
GET notifications/{public_id}/attempts/
GET notifications/{public_id}/receipts/
```

## 4. Realtime backend monitoring

Connect to:

```text
wss://notifications.example.com/ws/v1/external/notifications/
Subprotocol: musttip.external-notifications.v1
```

Send:

```json
{
  "protocol_version": 1,
  "event_type": "external.notifications.subscribe",
  "request_id": "subscription-01",
  "payload": {
    "limit": 25
  }
}
```

## 5. Realtime inbox for the developer's end user

The frontend first authenticates to the developer's own backend. The backend then issues a single-use realtime ticket through the REST API. The frontend connects with two subprotocols:

```text
musttip.external-notification-recipient.v1
musttip.notification-ticket.<one-time-ticket>
```

This ticket is recipient-bound and cannot inherit application-wide monitoring or management authority.

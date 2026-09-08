# Quickstart

Use an access token issued by the Must Tip authentication system for audience `urn:musttip:notification-service`. The SDK does not accept a tenant ID; tenant ownership is derived by the notification service from the verified token.

## Python

```python
from musttip_notifications import NotificationsClient, SdkConfig

client = NotificationsClient(
    SdkConfig(
        base_url="https://api.must-tip.com/api/v1/external/notifications",
        access_token=lambda: obtain_notification_access_token(),
    )
)

client.create_user_notification(
    "commerce-app",
    "customer-123",
    {
        "notification_type": "order.shipped",
        "title": "Order shipped",
        "body": "Your order is on the way.",
    },
    idempotency_key="order-8472-shipped-v1",
)

client.list_user_notifications("commerce-app", "customer-123")
client.list_group_notifications("ecommerce")
```

Delete only through an ownership-bound route when possible:

```python
client.delete_user_notification(
    "commerce-app",
    "customer-123",
    notification_public_id,
    idempotency_key=f"delete-{notification_public_id}",
)
```

## TypeScript

```ts
import { NotificationsClient } from "@musttip/notifications-core";

const client = new NotificationsClient({
  baseUrl: "https://api.must-tip.com/api/v1/external/notifications",
  accessToken: async () => obtainNotificationAccessToken(),
});

await client.createUserNotification(
  "commerce-app",
  "customer-123",
  {
    notification_type: "order.shipped",
    title: "Order shipped",
    body: "Your order is on the way.",
  },
  "order-8472-shipped-v1",
);
```

Do not add `tenant_id`, `X-Tenant-ID`, or `X-Application-ID`. The reference clients reject those authority overrides.

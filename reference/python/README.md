# Python reference SDK

This dependency-free transport reference demonstrates the canonical SDK behaviour. For a generated typed Python client, run the repository code generator with the `python` target.

```python
from musttip_notifications import NotificationsClient, SdkConfig

client = NotificationsClient(
    SdkConfig(
        base_url="https://notifications.example.com/api/v1/external/notifications",
        access_token=lambda: obtain_short_lived_access_token(),
    )
)

response = client.create_notification(
    {
        "recipient_identifier": "customer-123",
        "notification_type": "order.shipped",
        "title": "Order shipped",
        "message": "Order 4738 is on its way.",
        "channels": ["in_app", "push", "email"],
    },
    idempotency_key="order-4738-shipped-v1",
)
```

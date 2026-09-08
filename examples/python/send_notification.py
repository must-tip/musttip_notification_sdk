from __future__ import annotations

import os

from musttip_notifications import NotificationsClient, SdkConfig

client = NotificationsClient(
    SdkConfig(
        base_url=os.environ["NOTIFICATION_API_BASE_URL"],
        access_token=lambda: os.environ["NOTIFICATION_ACCESS_TOKEN"],
    )
)

response = client.create_notification(
    {
        "recipient_identifier": "customer-9834",
        "notification_type": "order.shipped",
        "title": "Your order has shipped",
        "message": "Order 4738 is on its way.",
        "channels": ["in_app", "push", "email"],
        "locale": "en-GB",
        "metadata": {"order_number": "4738"},
    },
    idempotency_key="order-4738-shipped-v1",
)
print(response.status_code, response.request_id, response.data)

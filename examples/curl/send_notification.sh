#!/usr/bin/env sh
set -eu
: "${NOTIFICATION_API_BASE_URL:?Set NOTIFICATION_API_BASE_URL}"
: "${NOTIFICATION_ACCESS_TOKEN:?Set NOTIFICATION_ACCESS_TOKEN}"

curl --fail-with-body --silent --show-error \
  --request POST \
  --url "${NOTIFICATION_API_BASE_URL%/}/notifications/" \
  --header "Authorization: Bearer ${NOTIFICATION_ACCESS_TOKEN}" \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --header 'Idempotency-Key: order-4738-shipped-v1' \
  --data '{
    "recipient_identifier": "customer-9834",
    "notification_type": "order.shipped",
    "title": "Your order has shipped",
    "message": "Order 4738 is on its way.",
    "channels": ["in_app", "push", "email"],
    "locale": "en-GB",
    "metadata": {"order_number": "4738"}
  }'

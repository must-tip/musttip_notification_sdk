# Realtime operation reference

## Routes

| Product | Path | Subprotocol |
|---|---|---|
| `internal_recipient` | `/ws/v1/notifications/` | `musttip.notifications.v1` |
| `external_developer` | `/ws/v1/external/notifications/` | `musttip.external-notifications.v1` |
| `external_recipient` | `/ws/v1/external/notifications/recipient/` | `musttip.external-notification-recipient.v1` |

## Client events

| Event type | Required scopes | Mutation idempotency | Availability |
|---|---|---:|---|
| `connection.ping` | Connection authority | No | All routes |
| `connection.heartbeat` | Connection authority | No | All routes |
| `external.notifications.subscribe` | `notifications.read` | No | External developer monitor |
| `external.notifications.fetch` | `notifications.read` | No | External developer monitor |
| `external.notifications.sync` | `notifications.read` | No | External developer monitor |
| `external.notifications.summary` | `notifications.read` | No | External developer monitor |
| `external.notification.get` | `notifications.read` | No | External developer monitor |
| `external.notification.create` | `notifications.send` | Required | External developer monitor |
| `external.notifications.create_batch` | `notifications.batch.send` | Required | External developer monitor |
| `external.notification.cancel` | `notifications.cancel` | Required | External developer monitor |
| `external.notification.retry` | `notifications.retry` | Required | External developer monitor |
| `external.notification.attempts` | `notifications.attempts.read` | No | External developer monitor |
| `external.notification.receipts` | `notifications.receipts.read` | No | External developer monitor |
| `external.notification.interactions` | `notifications.read` | No | External developer monitor |
| `external.notification.interaction.record` | `notifications.events.write` | Required | External developer monitor |
| `external.usage.summary` | `notifications.usage.read` | No | External developer monitor |
| `notifications.subscribe` | `notifications:read` | No | Internal and external recipient |
| `notifications.fetch` | `notifications:read` | No | Internal and external recipient |
| `notifications.sync` | `notifications:read` | No | Internal and external recipient |
| `notification.read` | `notifications:manage` | Required | Internal and external recipient |
| `notification.unread` | `notifications:manage` | Required | Internal and external recipient |
| `notification.delete` | `notifications:manage` | Required | Internal and external recipient |
| `notification.archive` | `notifications:manage` | Required | Internal and external recipient |
| `notification.dismiss` | `notifications:manage` | Required | Internal and external recipient |
| `notification.open` | `notifications:manage` | Required | Internal and external recipient |
| `notification.acknowledge` | `notifications:manage` | Required | Internal and external recipient |
| `notification.pin` | `notifications:manage` | Required | Internal and external recipient |
| `notification.unpin` | `notifications:manage` | Required | Internal and external recipient |
| `notification.complete` | `notifications:manage` | Required | Internal and external recipient |
| `notification.snooze` | `notifications:manage` | Required | Internal and external recipient |
| `notification.unsnooze` | `notifications:manage` | Required | Internal and external recipient |
| `notification.action` | `notifications:action` | Required | Internal and external recipient |
| `notification.reply` | `notifications:reply` | Required | Internal and external recipient |
| `notification.settings.fetch` | `notifications:settings:read` | No | Internal and external recipient |
| `notification.settings.update` | `notifications:settings:write` | Required | Internal and external recipient |

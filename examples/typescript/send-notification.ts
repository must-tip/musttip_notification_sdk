declare const process: { env: Record<string, string | undefined> };
import { NotificationsClient } from "../../reference/typescript/dist/index.js";

async function main(): Promise<void> {
  const client = new NotificationsClient({
    baseUrl: process.env.NOTIFICATION_API_BASE_URL!,
    accessToken: () => process.env.NOTIFICATION_ACCESS_TOKEN!,
  });

  const response = await client.createNotification(
    {
      recipient_identifier: "customer-9834",
      notification_type: "order.shipped",
      title: "Your order has shipped",
      message: "Order 4738 is on its way.",
      channels: ["in_app", "push", "email"],
      locale: "en-GB",
      metadata: { order_number: "4738" },
    },
    "order-4738-shipped-v1",
  );

  console.log(response.statusCode, response.requestId, response.data);
}

void main();

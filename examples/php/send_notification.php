<?php
declare(strict_types=1);
$baseUrl = rtrim(getenv('NOTIFICATION_API_BASE_URL') ?: throw new RuntimeException('NOTIFICATION_API_BASE_URL is required'), '/');
$token = getenv('NOTIFICATION_ACCESS_TOKEN') ?: throw new RuntimeException('NOTIFICATION_ACCESS_TOKEN is required');
$payload = json_encode([
    'recipient_identifier' => 'customer-9834',
    'notification_type' => 'order.shipped',
    'title' => 'Your order has shipped',
    'message' => 'Order 4738 is on its way.',
    'channels' => ['in_app', 'push', 'email'],
    'locale' => 'en-GB',
    'metadata' => ['order_number' => '4738'],
], JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE);
$curl = curl_init($baseUrl . '/notifications/');
curl_setopt_array($curl, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 10,
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer ' . $token,
        'Accept: application/json',
        'Content-Type: application/json',
        'Idempotency-Key: order-4738-shipped-v1',
    ],
    CURLOPT_POSTFIELDS => $payload,
]);
$body = curl_exec($curl);
if ($body === false) throw new RuntimeException(curl_error($curl));
$status = curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
curl_close($curl);
if ($status < 200 || $status >= 300) throw new RuntimeException("Notification API returned $status: $body");
echo "$status $body\n";

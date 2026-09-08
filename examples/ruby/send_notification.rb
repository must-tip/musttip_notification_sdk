# frozen_string_literal: true
require "json"
require "net/http"
require "uri"

base_url = ENV.fetch("NOTIFICATION_API_BASE_URL").sub(%r{/+$}, "")
token = ENV.fetch("NOTIFICATION_ACCESS_TOKEN")
uri = URI("#{base_url}/notifications/")
request = Net::HTTP::Post.new(uri)
request["Authorization"] = "Bearer #{token}"
request["Accept"] = "application/json"
request["Content-Type"] = "application/json"
request["Idempotency-Key"] = "order-4738-shipped-v1"
request.body = JSON.generate(
  recipient_identifier: "customer-9834",
  notification_type: "order.shipped",
  title: "Your order has shipped",
  message: "Order 4738 is on its way.",
  channels: %w[in_app push email],
  locale: "en-GB",
  metadata: { order_number: "4738" }
)
response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: uri.scheme == "https", read_timeout: 10) { |http| http.request(request) }
raise "Notification API returned #{response.code}: #{response.body}" unless response.is_a?(Net::HTTPSuccess)
puts "#{response.code} #{response["X-Request-ID"]} #{response.body}"

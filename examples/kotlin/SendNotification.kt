import java.net.URI
import java.net.http.HttpClient
import java.net.http.HttpRequest
import java.net.http.HttpResponse
import java.time.Duration

fun main() {
    val baseUrl = requireNotNull(System.getenv("NOTIFICATION_API_BASE_URL")) { "NOTIFICATION_API_BASE_URL is required" }.trimEnd('/')
    val token = requireNotNull(System.getenv("NOTIFICATION_ACCESS_TOKEN")) { "NOTIFICATION_ACCESS_TOKEN is required" }
    val body = """{"recipient_identifier":"customer-9834","notification_type":"order.shipped","title":"Your order has shipped","message":"Order 4738 is on its way.","channels":["in_app","push","email"],"locale":"en-GB","metadata":{"order_number":"4738"}}"""
    val request = HttpRequest.newBuilder(URI.create("$baseUrl/notifications/"))
        .timeout(Duration.ofSeconds(10))
        .header("Authorization", "Bearer $token")
        .header("Accept", "application/json")
        .header("Content-Type", "application/json")
        .header("Idempotency-Key", "order-4738-shipped-v1")
        .POST(HttpRequest.BodyPublishers.ofString(body))
        .build()
    val response = HttpClient.newHttpClient().send(request, HttpResponse.BodyHandlers.ofString())
    check(response.statusCode() in 200..299) { "Notification API returned ${response.statusCode()}: ${response.body()}" }
    println("${response.statusCode()} ${response.body()}")
}

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

public final class SendNotification {
    public static void main(String[] args) throws Exception {
        String baseUrl = require("NOTIFICATION_API_BASE_URL").replaceAll("/+$", "");
        String token = require("NOTIFICATION_ACCESS_TOKEN");
        String body = """
            {"recipient_identifier":"customer-9834","notification_type":"order.shipped",\
            "title":"Your order has shipped","message":"Order 4738 is on its way.",\
            "channels":["in_app","push","email"],"locale":"en-GB",\
            "metadata":{"order_number":"4738"}}
            """;
        HttpRequest request = HttpRequest.newBuilder(URI.create(baseUrl + "/notifications/"))
            .timeout(Duration.ofSeconds(10))
            .header("Authorization", "Bearer " + token)
            .header("Accept", "application/json")
            .header("Content-Type", "application/json")
            .header("Idempotency-Key", "order-4738-shipped-v1")
            .POST(HttpRequest.BodyPublishers.ofString(body))
            .build();
        HttpResponse<String> response = HttpClient.newHttpClient().send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new IllegalStateException("Notification API returned " + response.statusCode() + ": " + response.body());
        }
        System.out.println(response.statusCode() + " " + response.headers().firstValue("X-Request-ID").orElse("") + " " + response.body());
    }

    private static String require(String name) {
        String value = System.getenv(name);
        if (value == null || value.isBlank()) throw new IllegalStateException(name + " is required");
        return value;
    }
}

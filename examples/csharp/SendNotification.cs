using System.Net.Http.Headers;
using System.Text;

var baseUrl = (Environment.GetEnvironmentVariable("NOTIFICATION_API_BASE_URL")
    ?? throw new InvalidOperationException("NOTIFICATION_API_BASE_URL is required")).TrimEnd('/');
var token = Environment.GetEnvironmentVariable("NOTIFICATION_ACCESS_TOKEN")
    ?? throw new InvalidOperationException("NOTIFICATION_ACCESS_TOKEN is required");
using var client = new HttpClient { Timeout = TimeSpan.FromSeconds(10) };
client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
client.DefaultRequestHeaders.Accept.ParseAdd("application/json");
var json = """
{"recipient_identifier":"customer-9834","notification_type":"order.shipped","title":"Your order has shipped","message":"Order 4738 is on its way.","channels":["in_app","push","email"],"locale":"en-GB","metadata":{"order_number":"4738"}}
""";
using var request = new HttpRequestMessage(HttpMethod.Post, $"{baseUrl}/notifications/") {
    Content = new StringContent(json, Encoding.UTF8, "application/json")
};
request.Headers.Add("Idempotency-Key", "order-4738-shipped-v1");
using var response = await client.SendAsync(request);
var body = await response.Content.ReadAsStringAsync();
response.EnsureSuccessStatusCode();
Console.WriteLine($"{(int)response.StatusCode} {body}");

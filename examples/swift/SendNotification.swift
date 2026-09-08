import Foundation
#if canImport(FoundationNetworking)
import FoundationNetworking
#endif

let environment = ProcessInfo.processInfo.environment
guard let rawBaseURL = environment["NOTIFICATION_API_BASE_URL"],
      let token = environment["NOTIFICATION_ACCESS_TOKEN"] else {
    fatalError("NOTIFICATION_API_BASE_URL and NOTIFICATION_ACCESS_TOKEN are required")
}
let baseURL = rawBaseURL.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
guard let url = URL(string: "\(baseURL)/notifications/") else { fatalError("Invalid base URL") }
let payload: [String: Any] = [
    "recipient_identifier": "customer-9834",
    "notification_type": "order.shipped",
    "title": "Your order has shipped",
    "message": "Order 4738 is on its way.",
    "channels": ["in_app", "push", "email"],
    "locale": "en-GB",
    "metadata": ["order_number": "4738"]
]
var request = URLRequest(url: url)
request.httpMethod = "POST"
request.timeoutInterval = 10
request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
request.setValue("application/json", forHTTPHeaderField: "Accept")
request.setValue("application/json", forHTTPHeaderField: "Content-Type")
request.setValue("order-4738-shipped-v1", forHTTPHeaderField: "Idempotency-Key")
request.httpBody = try JSONSerialization.data(withJSONObject: payload)
let semaphore = DispatchSemaphore(value: 0)
var failure: Error?
URLSession.shared.dataTask(with: request) { data, response, error in
    defer { semaphore.signal() }
    if let error { failure = error; return }
    guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
        failure = NSError(domain: "MustTipNotifications", code: 1)
        return
    }
    print(http.statusCode, String(data: data ?? Data(), encoding: .utf8) ?? "")
}.resume()
semaphore.wait()
if let failure { throw failure }

package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"
)

func main() {
	baseURL := strings.TrimRight(os.Getenv("NOTIFICATION_API_BASE_URL"), "/")
	token := os.Getenv("NOTIFICATION_ACCESS_TOKEN")
	if baseURL == "" || token == "" {
		panic("NOTIFICATION_API_BASE_URL and NOTIFICATION_ACCESS_TOKEN are required")
	}
	payload := map[string]any{
		"recipient_identifier": "customer-9834",
		"notification_type":    "order.shipped",
		"title":                "Your order has shipped",
		"message":              "Order 4738 is on its way.",
		"channels":             []string{"in_app", "push", "email"},
		"locale":               "en-GB",
		"metadata":             map[string]string{"order_number": "4738"},
	}
	body, err := json.Marshal(payload)
	if err != nil {
		panic(err)
	}
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, baseURL+"/notifications/", bytes.NewReader(body))
	if err != nil {
		panic(err)
	}
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Accept", "application/json")
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Idempotency-Key", "order-4738-shipped-v1")
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()
	raw, err := io.ReadAll(io.LimitReader(resp.Body, 8*1024*1024))
	if err != nil {
		panic(err)
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		panic(fmt.Sprintf("notification API returned %d: %s", resp.StatusCode, string(raw)))
	}
	fmt.Println(resp.StatusCode, resp.Header.Get("X-Request-ID"), string(raw))
}

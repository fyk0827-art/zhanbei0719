package com.lifeblueprint.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lifeblueprint.config.PaymentProperties;
import com.lifeblueprint.domain.OrderRecord;
import com.lifeblueprint.domain.OrderStatus;
import com.lifeblueprint.repository.DeliveryRepository;
import com.lifeblueprint.repository.PaymentRepository;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class PaypalService {
    private final DeliveryConfigService config;
    private final DeliveryRepository delivery;
    private final PaymentRepository payments;
    private final PaymentProperties paymentProperties;
    private final PricingService pricingService;
    private final FacebookConversionsService conversions;
    private final ObjectMapper json;
    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(20)).build();

    public PaypalService(DeliveryConfigService config, DeliveryRepository delivery, PaymentRepository payments,
                         PaymentProperties paymentProperties, PricingService pricingService, ObjectMapper json,
                         FacebookConversionsService conversions) {
        this.config = config;
        this.delivery = delivery;
        this.payments = payments;
        this.paymentProperties = paymentProperties;
        this.pricingService = pricingService;
        this.json = json;
        this.conversions = conversions;
    }

    public Map<String, Object> createOrder(String reportId, String returnToken, String clientIp, String userAgent,
                                           String fbp, String fbc, String sourcePath) throws Exception {
        Map<String, Object> report = delivery.report(reportId).orElseThrow(() -> new IllegalArgumentException("Report input not found"));
        String email = report.get("email") == null ? null : String.valueOf(report.get("email"));
        if (email == null || email.isBlank()) throw new IllegalArgumentException("A report delivery email is required");
        int amount = pricingService.currentAmountCents();
        String internalId = PaymentRepository.newOrderId();
        OrderRecord order = new OrderRecord(internalId, reportId, amount,
            paymentProperties.getProductTitle(), "paypal", OrderStatus.pending, null, email,
            System.currentTimeMillis(), null);
        payments.upsertOrder(order);

        String frontend = paymentProperties.getFrontendUrl().replaceAll("/+$", "");
        String returnUrl;
        String cancelUrl;
        if (returnToken != null && !returnToken.isBlank()) {
            String encodedToken = URLEncoder.encode(returnToken, StandardCharsets.UTF_8);
            returnUrl = frontend + "/report-access?paypal=return#accessToken=" + encodedToken;
            cancelUrl = frontend + "/report-access?paypal=cancel#accessToken=" + encodedToken;
        } else {
            returnUrl = frontend + "/generator/final-report?paypal=return&reportId=" +
                URLEncoder.encode(reportId, StandardCharsets.UTF_8);
            cancelUrl = frontend + "/generator/final-report?paypal=cancel&reportId=" +
                URLEncoder.encode(reportId, StandardCharsets.UTF_8);
        }
        Map<String, Object> payload = Map.of(
            "intent", "CAPTURE",
            "purchase_units", new Object[]{Map.of(
                "reference_id", internalId,
                "description", paymentProperties.getProductTitle(),
                "amount", Map.of("currency_code", "USD", "value", String.format("%.2f", amount / 100.0))
            )},
            "payment_source", Map.of("paypal", Map.of("experience_context", Map.of(
                "return_url", returnUrl, "cancel_url", cancelUrl, "user_action", "PAY_NOW", "shipping_preference", "NO_SHIPPING"
            )))
        );
        JsonNode response = paypalRequest("POST", "/v2/checkout/orders", json.writeValueAsString(payload));
        String paypalOrderId = response.path("id").asText();
        if (paypalOrderId.isBlank()) throw new IllegalStateException("PayPal did not return an order id");
        delivery.attachPaypalOrder(internalId, paypalOrderId, config.paypalEnvironment(), clientIp, userAgent, fbp, fbc, sourcePath);
        conversions.enqueueServer("CheckoutStarted", paypalOrderId, System.currentTimeMillis(), sourcePath,
            reportId, clientIp, userAgent, fbp, fbc,
            Map.of("value", amount / 100.0, "currency", "USD", "report_type", "full"));
        String approvalUrl = "";
        for (JsonNode link : response.path("links")) {
            if ("payer-action".equals(link.path("rel").asText()) || "approve".equals(link.path("rel").asText())) {
                approvalUrl = link.path("href").asText();
                break;
            }
        }
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("orderId", internalId);
        result.put("paypalOrderId", paypalOrderId);
        result.put("reportId", reportId);
        result.put("approvalUrl", approvalUrl);
        result.put("amount", amount);
        result.put("currency", "USD");
        result.put("environment", config.paypalEnvironment());
        return result;
    }

    public Map<String, Object> capture(String paypalOrderId) throws Exception {
        Map<String, Object> existing = delivery.paypalOrder(paypalOrderId).orElseThrow(() -> new IllegalArgumentException("PayPal order not found"));
        if ("paid".equals(String.valueOf(existing.get("status")))) {
            queuePurchase(existing, String.valueOf(existing.get("paypal_capture_id")));
            return captureResult(paypalOrderId, String.valueOf(existing.get("paypal_capture_id")),
                String.valueOf(existing.get("report_id")), true);
        }
        JsonNode response;
        try {
            response = paypalRequest("POST", "/v2/checkout/orders/" + paypalOrderId + "/capture", "{}");
        } catch (Exception e) {
            Map<String, Object> raced = delivery.paypalOrder(paypalOrderId).orElse(existing);
            if ("paid".equals(String.valueOf(raced.get("status")))) {
                return captureResult(paypalOrderId, String.valueOf(raced.get("paypal_capture_id")),
                    String.valueOf(raced.get("report_id")), true);
            }
            throw e;
        }
        String status = response.path("status").asText();
        JsonNode capture = response.path("purchase_units").path(0).path("payments").path("captures").path(0);
        String captureId = capture.path("id").asText();
        String payerEmail = response.path("payer").path("email_address").asText(null);
        String reportId = null;
        if ("COMPLETED".equals(status)) {
            reportId = delivery.markPaypalPaid(paypalOrderId, captureId, payerEmail).orElse(null);
            Map<String, Object> paid = delivery.paypalOrder(paypalOrderId).orElse(existing);
            queuePurchase(paid, captureId);
        }
        return captureResult(paypalOrderId, captureId, reportId, "COMPLETED".equals(status));
    }

    private Map<String, Object> captureResult(String paypalOrderId, String captureId, String reportId, boolean paid) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("paypalOrderId", paypalOrderId);
        result.put("captureId", captureId == null || "null".equals(captureId) ? "" : captureId);
        result.put("status", paid ? "COMPLETED" : "PENDING");
        result.put("reportId", reportId);
        result.put("paid", paid);
        return result;
    }

    public void handleWebhook(Map<String, String> headers, String rawBody) throws Exception {
        String webhookId = config.paypalWebhookId();
        if (webhookId.isBlank()) throw new IllegalStateException("PayPal webhook id is not configured");
        JsonNode event = json.readTree(rawBody);
        Map<String, Object> verifyPayload = Map.of(
            "auth_algo", headers.getOrDefault("paypal-auth-algo", ""),
            "cert_url", headers.getOrDefault("paypal-cert-url", ""),
            "transmission_id", headers.getOrDefault("paypal-transmission-id", ""),
            "transmission_sig", headers.getOrDefault("paypal-transmission-sig", ""),
            "transmission_time", headers.getOrDefault("paypal-transmission-time", ""),
            "webhook_id", webhookId,
            "webhook_event", event
        );
        JsonNode verify = paypalRequest("POST", "/v1/notifications/verify-webhook-signature", json.writeValueAsString(verifyPayload));
        if (!"SUCCESS".equals(verify.path("verification_status").asText())) {
            throw new IllegalArgumentException("Invalid PayPal webhook signature");
        }
        String eventType = event.path("event_type").asText();
        JsonNode resource = event.path("resource");
        String paypalOrderId = resource.path("supplementary_data").path("related_ids").path("order_id").asText();
        if ("PAYMENT.CAPTURE.COMPLETED".equals(eventType)) {
            String captureId = resource.path("id").asText();
            delivery.markPaypalPaid(paypalOrderId, captureId, null);
            delivery.paypalOrder(paypalOrderId).ifPresent(row -> queuePurchase(row, captureId));
        } else if (eventType.startsWith("PAYMENT.CAPTURE.REFUNDED")) {
            delivery.markPaypalRefunded(paypalOrderId);
        }
    }

    private void queuePurchase(Map<String, Object> order, String captureId) {
        if (captureId == null || captureId.isBlank() || "null".equals(captureId)) return;
        int amount = ((Number) order.getOrDefault("amount", 0)).intValue();
        long paidAt = order.get("paid_at") instanceof Number value ? value.longValue() : System.currentTimeMillis();
        conversions.enqueueServer("PurchaseCompleted", captureId, paidAt,
            string(order.get("analytics_source_path")), string(order.get("report_id")),
            string(order.get("analytics_client_ip")), string(order.get("analytics_user_agent")),
            string(order.get("analytics_fbp")), string(order.get("analytics_fbc")),
            Map.of("value", amount / 100.0, "currency", String.valueOf(order.getOrDefault("currency", "USD"))));
    }

    private static String string(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    private JsonNode paypalRequest(String method, String path, String body) throws Exception {
        String clientId = config.paypalClientId();
        String secret = config.paypalSecret();
        if (clientId.isBlank() || secret.isBlank()) throw new IllegalStateException("PayPal credentials are not configured");
        String base = config.paypalEnvironment().equals("live") ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
        String basic = Base64.getEncoder().encodeToString((clientId + ":" + secret).getBytes(StandardCharsets.UTF_8));
        HttpRequest tokenRequest = HttpRequest.newBuilder(URI.create(base + "/v1/oauth2/token"))
            .timeout(Duration.ofSeconds(30)).header("Authorization", "Basic " + basic)
            .header("Content-Type", "application/x-www-form-urlencoded")
            .POST(HttpRequest.BodyPublishers.ofString("grant_type=client_credentials")).build();
        HttpResponse<String> tokenResponse = http.send(tokenRequest, HttpResponse.BodyHandlers.ofString());
        if (tokenResponse.statusCode() / 100 != 2) throw new IllegalStateException("PayPal authentication failed");
        String accessToken = json.readTree(tokenResponse.body()).path("access_token").asText();
        HttpRequest.Builder builder = HttpRequest.newBuilder(URI.create(base + path)).timeout(Duration.ofSeconds(60))
            .header("Authorization", "Bearer " + accessToken).header("Content-Type", "application/json")
            .header("PayPal-Request-Id", java.util.UUID.randomUUID().toString());
        HttpRequest request = "GET".equals(method) ? builder.GET().build() : builder.POST(HttpRequest.BodyPublishers.ofString(body)).build();
        HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() / 100 != 2) throw new IllegalStateException("PayPal request failed with HTTP " + response.statusCode());
        return json.readTree(response.body());
    }
}

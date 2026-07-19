package com.lifeblueprint.web;

import com.lifeblueprint.service.PaypalService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/paypal")
public class PaypalController {
    private final PaypalService paypal;
    public PaypalController(PaypalService paypal) { this.paypal = paypal; }

    @PostMapping("/orders")
    public Map<String, Object> create(@RequestBody Map<String, String> body) throws Exception {
        String reportId = body.get("reportId");
        if (reportId == null || reportId.isBlank()) throw new IllegalArgumentException("reportId is required");
        return paypal.createOrder(reportId.trim());
    }

    @PostMapping("/orders/{paypalOrderId}/capture")
    public Map<String, Object> capture(@PathVariable String paypalOrderId) throws Exception {
        return paypal.capture(paypalOrderId);
    }

    @PostMapping("/webhook")
    public ResponseEntity<String> webhook(HttpServletRequest request, @RequestBody String rawBody) throws Exception {
        Map<String, String> headers = new HashMap<>();
        request.getHeaderNames().asIterator().forEachRemaining(name -> headers.put(name.toLowerCase(), request.getHeader(name)));
        paypal.handleWebhook(headers, rawBody);
        return ResponseEntity.ok("OK");
    }
}

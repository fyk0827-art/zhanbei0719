# PayPal report delivery setup

## Required server configuration

Set a stable encryption master key before entering any credentials in the admin dashboard:

```bash
APP_CONFIG_ENCRYPTION_KEY=<a-long-random-production-secret>
PAYMENT_FRONTEND_URL=https://your-public-site.example
PAYMENT_BASE_URL=https://your-api.example
```

The encryption key must remain stable between deployments. Losing or changing it makes previously encrypted admin settings unreadable.

## Admin settings

Open **Admin > Settings** and configure:

- PayPal Sandbox Client ID, Secret and Webhook ID
- PayPal Live Client ID, Secret and Webhook ID
- DeepSeek API key and model
- Resend API key and verified From address

Secrets are write-only: the API returns configured flags, never their plaintext values.

## PayPal webhook

Create a webhook for:

```text
https://your-api.example/api/paypal/webhook
```

Subscribe at minimum to `PAYMENT.CAPTURE.COMPLETED` and `PAYMENT.CAPTURE.REFUNDED`. Copy the environment-specific Webhook ID into the matching Sandbox or Live admin setting.

## Resend

Verify the sending domain in Resend before switching to production. The report email links to:

```text
https://your-public-site.example/report-access?token=<random-token>
```

Only a SHA-256 hash of each access token is stored in MySQL.

## Worker behavior

The Spring Boot process polls MySQL-backed report and email jobs. Keep at least one backend instance running. Interrupted generation jobs are recovered after five minutes; report generation and email delivery each retry up to three times.

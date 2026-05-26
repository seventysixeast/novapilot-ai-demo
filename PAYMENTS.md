# Payment Gateways Setup Guide

This document provides step-by-step instructions to configure and test payment gateways in this project.

---

## 1. Stripe Integration (Cards & Wallets)

### Environment Variables
Add the following keys to your `.env.local` file:
- `STRIPE_SECRET_KEY`: Get from Stripe Dashboard (Developers > API Keys).
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Get from Stripe Dashboard.
- `STRIPE_WEBHOOK_SECRET`: See instructions below.

### Local Development (Webhooks)
1. Install **Stripe CLI** on your machine.
2. Run `stripe login` to authorize.
3. Run `stripe listen --forward-to localhost:3000/api/webhooks/stripe`.
4. Copy the `whsec_...` key provided by the terminal and add it to `STRIPE_WEBHOOK_SECRET`.

---

## 2. PayPal Integration (Standard & Subscriptions)

### Environment Variables
Add the following keys to your `.env.local` file:
- `PAYPAL_CLIENT_ID`: Get from PayPal Developer Dashboard (Apps & Credentials).
- `PAYPAL_CLIENT_SECRET`: Get from PayPal Developer Dashboard.

### Testing (Sandbox)
1. Go to **PayPal Developer Dashboard > Testing Tools > Sandbox Accounts**.
2. **Important:** Create a **US Business Account** to generate the `PAYPAL_CLIENT_ID`. If you use an Indian business account, USD subscription checkouts will fail.
3. Use a **US Personal** sandbox account to log in during checkout.
4. Do not use your real credentials or business account credentials for making a test payment.

---

## 3. Razorpay Integration (UPI & Local Indian Payments)

### Environment Variables
Add the following keys to your `.env.local` file:
- `RAZORPAY_KEY_ID`: Get from Razorpay Dashboard (Settings > API Keys).
- `RAZORPAY_KEY_SECRET`: Get from Razorpay Dashboard.
- `RAZORPAY_WEBHOOK_SECRET`: Defined by you during webhook creation.

### Testing (Test Mode)
1. Ensure the dashboard is in **Test Mode**.
2. When the checkout popup appears, select **Netbanking** (e.g., choose SBI and click Success) as it works universally without KYC.
3. Alternatively, if UPI is enabled for your test account, select **UPI** and use the test ID: `success@razorpay`. Note: New Razorpay accounts may hide the UPI option until live KYC is completed.

---

## Testing Credentials
- **Stripe Test Card:** `4242 4242 4242 4242`
- **PayPal Sandbox:** Use a "US Personal" account from PayPal Developer Tools.
- **Razorpay:** Use **Netbanking** > Any Bank > Click 'Success'. (Or UPI: `success@razorpay` if visible).

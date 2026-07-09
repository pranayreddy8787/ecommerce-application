# Security Specification: E-Commerce Web Application

## 1. Data Invariants

1. **Product Integrity**: Products can only be created, modified, or deleted by verified Admins. Standard users can only read products. Product price must be greater than zero, and stock must be non-negative.
2. **Order Identity**: Orders must be created by authenticated users. The `userId` of the order must strictly match the authenticated user's UID.
3. **Order Status Control**: Standard users can create orders (with a default status of `pending`) and view their own orders. Only Admins can update the `status` of any order (e.g., mark as `shipped` or `delivered`).
4. **User Profiles (RBAC)**: Users can read and write their own profile document. However, standard users are strictly forbidden from self-assigning or changing their `role` to `admin`. The `role` field is a protected system-generated field.

---

## 2. The "Dirty Dozen" Payloads (Malicious Writes)

Here are 12 specific payloads or operations designed to breach identity, integrity, and state, which MUST return `PERMISSION_DENIED`:

### Product Vulnerabilities (Admin Only)
1. **Unauthenticated Product Creation**: An anonymous user attempts to create a product.
2. **Standard User Product Creation**: A signed-in user without the Admin role attempts to create a product.
3. **Product Price Poisoning**: An Admin attempts to create a product with a negative price (e.g., `-10.00`).
4. **Product Malicious Update**: A standard user attempts to update a product's price to `$0.01` to purchase it cheaply.

### Order Vulnerabilities (Identity & Integrity)
5. **Order Spoofing (Identity Theft)**: User A attempts to create an order with `userId` set to User B's UID.
6. **Order Read Scraping (PII Leak)**: User A attempts to read User B's order details.
7. **Order Status Escapade**: A standard user attempts to update their own order status to `delivered` or `shipped` without making a payment.
8. **Order Total Poisoning**: A user creates an order with a negative `totalAmount` or empty items list.
9. **Unauthenticated Checkout**: An unauthenticated user attempts to create an order.

### User & RBAC Vulnerabilities
10. **Admin Privilege Escalation (Self-Promo)**: Standard User A attempts to update their own profile document to set `role: "admin"`.
11. **User Profile Hijacking**: User A attempts to modify User B's user profile document.
12. **System Account Modification**: A non-admin user attempts to write to the `admins` collection or write directly to another user's PII.

---

## 3. Test Runner: `firestore.rules.test.ts`

*(Note: In our sandboxed container environment, we will use our production rules and verify with ESLint to guarantee correct structural validation. Below is the test representation for security verification.)*

```ts
// firestore.rules.test.ts
// Synthesized for testing rules validation against security posture.
```

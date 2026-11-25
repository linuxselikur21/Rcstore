# RC STORE — Security Rules Specification

## Data Invariants
1. **Catalog Integrity**: Products and categories are publicly readable for storefront browsing, while create, update, and delete operations are strictly restricted to verified administrators (`isAdmin()`).
2. **Order Immutability & PII Protection**: Customer orders contain PII (`fullName`, `whatsapp`, `address`, `city`, `district`, `postalCode`). Orders may be created during checkout with `status == 'Pending'` and strict field allowlisting, but reading, listing, updating, or deleting orders is strictly restricted to verified administrators or the authenticated order owner (`resource.data.userId == request.auth.uid`).
3. **Atomic Line Items**: Order line items under `/orders/{orderId}/items/{itemId}` cannot exist orphaned; creation requires `existsAfter(/databases/$(database)/documents/orders/$(orderId))` in an atomic batch and strict field/size validation.
4. **No Self-Assigned Privileges**: Users cannot write to `/admins/{uid}` or set RBAC fields on client-created documents. Bootstrapped admin (`linuxselikur@gmail.com`) requires `request.auth.token.email_verified == true`.
5. **Write-Only Public Submissions**: `/subscribers` and `/contact_messages` allow validated public creation (`create`) with strict length/schema limits, while `read` and `delete` are restricted exclusively to admins.

## Dirty Dozen Adversarial Payloads (Expected: PERMISSION_DENIED)
1. **Unauthenticated Product Creation**: Anonymous client creates `/products/fake-tee` -> Denied (`isAdmin()` fails).
2. **Shadow Field Injection on Order**: Checkout payload adds `isAdmin: true` or `paid: true` -> Denied (`keys().hasOnly(...)` fails).
3. **Order Status Shortcutting**: Checkout payload sets `status: 'Completed'` instead of `'Pending'` -> Denied.
4. **Cross-User Order Read (PII Leak)**: Signed-in non-admin user queries `/orders` without owner match -> Denied (`allow list` requires `isAdmin()` or `resource.data.userId == request.auth.uid`).
5. **Email Spoofing Admin Bypass**: Token has `email: 'linuxselikur@gmail.com'` with `email_verified: false` -> Denied.
6. **ID Poisoning**: Document ID contains 1500 chars or `/` / `$` characters -> Denied (`isValidId()` regex + size check).
7. **Orphaned Order Item**: Client creates `/orders/nonexistent/items/item1` without parent order in batch -> Denied (`existsAfter()` fails).
8. **Client Timestamp Forgery**: Order `createdAt` is backdated instead of `request.time` -> Denied.
9. **Oversized Message Denial-of-Wallet**: Contact message body exceeds 1500 characters -> Denied.
10. **Non-Admin Order Status Tampering**: Customer updates `/orders/{id}` to `status: 'Shipped'` -> Denied (`isAdmin()` required).
11. **Self-Promotion to Admin**: Authenticated user writes `/admins/{uid}` -> Denied.
12. **Terminal State Overwrite Bypass**: Update omits validation helper or changes `createdAt` -> Denied (`createdAt == existing().createdAt` & `isValidOrder`).

# Quickware Security Specification & Adversarial Audit Plan

## 1. Data Invariants
1. **Verified Google Identity**: All authenticated customer writes (profiles, addresses, orders, enquiries) require `request.auth != null && request.auth.token.email_verified == true`.
2. **PII Isolation**: User profiles (`/users/{userId}`), saved addresses (`/users/{userId}/addresses/{addressId}`), orders (`/orders/{orderId}`), and enquiries (`/enquiries/{enquiryId}`) are strictly readable only by the owning user (`uid == request.auth.uid`) or a verified Admin. Blanket `isSignedIn()` reads on PII collections are forbidden.
3. **No Self-Assigned Admin Roles**: A user creating `/users/{userId}` can only set `role: 'customer'`. Role escalation via profile updates is blocked. Admin privileges are granted only via `/admins/{uid}` or verified runtime admin email (`rahulmishraa0504@gmail.com` with `email_verified == true`).
4. **Catalogue Integrity**: `/products/{productId}`, `/retailers/{retailerId}`, and `/config/{configId}` can only be created, updated, or deleted by verified Admins.
5. **Order Immutability & Terminal State Locking**: Once an order reaches `Delivered` or `Cancelled`, non-admin users cannot modify it. Customers can only create orders with `status: 'Order Placed'`, their own `userId`, their verified `customerEmail`, and server-verified timestamps (`request.time`).
6. **Master Gate on Subcollections**: `/users/{userId}/addresses/{addressId}` and `/users/{userId}/cart/{productId}` verify parent `/users/{userId}` existence via `get()` on single-document operations, enforce strict `keys().hasOnly(...)` schema validation, and enforce server `request.time` on timestamps.

## 2. The "Dirty Dozen" Attack Payloads
1. **Shadow Field Injection on User Create**: `{ uid, email, displayName, defaultLocality, role: 'customer', isVerifiedAdmin: true, createdAt, updatedAt }` -> Rejected by `keys().hasOnly(...)`.
2. **Self-Privilege Escalation on User Create**: `{ uid, email, displayName, defaultLocality, role: 'admin', createdAt, updatedAt }` -> Rejected by `incoming().role == 'customer'`.
3. **Role Tampering on User Update**: Updating `role: 'admin'` on `/users/{uid}` -> Rejected by `affectedKeys().hasOnly(...)` and `incoming().role == existing().role`.
4. **Spoofed Email Admin Access**: Unverified token (`email_verified: false`) with `email: 'rahulmishraa0504@gmail.com'` -> Rejected by `isVerifiedUser()`.
5. **Cross-User Order Read**: User B attempting `get(/orders/orderOfUserA)` -> Rejected by `existing().userId == request.auth.uid`.
6. **Unfiltered Order List Scrape**: Non-admin running `collection('orders').get()` without `where('userId', '==', uid)` -> Rejected by `allow list: if isAdmin() || (isVerifiedUser() && resource.data.userId == request.auth.uid)`.
7. **Order Status Shortcutting**: Customer creating an order with `status: 'Delivered'` -> Rejected by `incoming().status == 'Order Placed'`.
8. **Post-Delivery Order Tampering**: Customer updating a `Delivered` order to `Cancelled` -> Rejected by terminal state guard `!(existing().status in ['Delivered', 'Cancelled'])`.
9. **ID Poisoning**: Creating `/orders/<1500-char-string>` -> Rejected by `isValidId(orderId)`.
10. **Client Timestamp Forgery**: Creating an order with backdated `createdAt` instead of `serverTimestamp()` -> Rejected by `incoming().createdAt == request.time`.
11. **Non-Admin Product Price Manipulation**: Customer attempting to update `/products/prd-101` price to `1` -> Rejected by `isAdmin()`.
12. **Orphaned Address Write**: Writing to `/users/uid/addresses/addr1` when `/users/uid` does not exist -> Rejected by parent `get()` Master Gate.

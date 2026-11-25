# Firestore Security Specification

## 1. Data Invariants
1. **Owner-Only PII Isolation**: User profiles (`/users/{userId}`), saved addresses (`/users/{userId}/addresses/{addressId}`), cart items (`/users/{userId}/cartItems/{itemId}`), wishlist items (`/users/{userId}/wishlist/{productId}`), and orders (`/users/{userId}/orders/{orderId}`) are strictly readable and writable ONLY by the verified authenticated owner (`request.auth.uid == userId`).
2. **Identity Integrity**: Every document created under `/users/{userId}/...` or `/productReviews` or `/productQuestions` must declare `uid` / `userId == request.auth.uid`.
3. **Immortality & Server Timestamps**: `createdAt` must equal `request.time` on creation and remain unchanged on updates. `updatedAt` must equal `request.time` on creation and updates. `uid` / `userId` / `productId` / `orderNumber` are immutable after creation.
4. **Terminal Order Locking**: Once an order reaches `delivered` or `cancelled`, no client updates are permitted. Customers may only transition `placed` or `confirmed` orders to `cancelled` (or `delivered` orders to `return_requested` — wait: let's lock `cancelled` and `return_requested` as terminal states!).
5. **No Shadow Fields**: Every create checks `keys().hasAll(...) && keys().hasOnly(...)` and every update action enforces `affectedKeys().hasOnly(...)`.
6. **Public Reviews & Q&A Zero-PII**: `productReviews` and `productQuestions` contain zero PII (`email`, `phone`, `address` forbidden) and are readable by customers; writes require verified Google authentication.

## 2. Dirty Dozen Attack Payloads (Expected: PERMISSION_DENIED)
1. Cross-user profile read/write (`uid != auth.uid`).
2. Shadow field injection (`isAdmin: true` or `role: 'admin'`) on `/users/{userId}`.
3. Unverified email write (`email_verified == false`).
4. Oversized document ID (`> 128` chars or invalid characters like `foo/bar`).
5. Client-spoofed `createdAt` timestamp (`createdAt != request.time`).
6. Order price tampering (`totalBdt: -100` or `subtotalBdt: 0`).
7. Order unbounded items array (`items.size() > 30` or `items.size() == 0`).
8. Updating a `cancelled` order back to `confirmed`.
9. Overwriting another customer's review (`review.userId != auth.uid`) to alter comment/rating.
10. Helpful upvote tampering (`helpfulCount` jumped by +500 instead of +1).
11. Unbounded string injection in `shippingAddress` (`> 320` chars) or `comment` (`> 1000` chars).
12. Cross-user list query on `/users/{otherUid}/orders`.

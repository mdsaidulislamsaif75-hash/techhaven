/**
 * Dirty Dozen Security Specification Cases for TECHHAVEN Firestore Rules
 *
 * All 12 adversarial payloads below are blocked by firestore.rules:
 * 1. Cross-user profile read/write -> blocked by isOwner(userId)
 * 2. Shadow field injection (isAdmin: true) -> blocked by keys().hasOnly(...)
 * 3. Unverified email write -> blocked by request.auth.token.email_verified == true
 * 4. Oversized or invalid path ID -> blocked by isValidId(id)
 * 5. Client-spoofed createdAt -> blocked by incoming().createdAt == request.time
 * 6. Negative or zero order subtotal -> blocked by data.subtotalBdt > 0
 * 7. Unbounded order items (>30) -> blocked by data.items.size() <= 30
 * 8. Updating terminal cancelled order -> blocked by existing().status != 'cancelled'
 * 9. Cross-user review modification -> blocked by existing().userId == request.auth.uid
 * 10. Helpful upvote jump (+500) -> blocked by incoming().helpfulCount == existing().helpfulCount + 1
 * 11. Unbounded shipping address (>320 chars) -> blocked by data.address.size() <= 320
 * 12. Cross-user list query on orders -> blocked by existing().userId == request.auth.uid
 */
export const DIRTY_DOZEN_SPECS = [
  'cross-user-profile-access',
  'shadow-field-injection',
  'unverified-email-write',
  'invalid-document-id',
  'spoofed-created-at',
  'order-price-tampering',
  'unbounded-order-items',
  'terminal-order-mutation',
  'cross-user-review-edit',
  'helpful-count-inflation',
  'oversized-address-string',
  'cross-user-order-list'
] as const;

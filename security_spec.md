# Security Specification for SkillStudio

## Data Invariants
1. A user can only read and write their own profile document in `/users/{userId}`.
2. Only verified users can create courses (if relevant, for now we restrict to owner).
3. Subscription plans and learning stats are system-protected (users can't modify them arbitrarily).

## The Dirty Dozen Payloads

1. **Identity Spoofing**: Update `users/alice` while authenticated as `bob`.
2. **Subscription Escalation**: Set `subscriptionPlan` to `pro` via client SDK.
3. **Stat Manipulation**: Set `learningStats.points` to `999999` manually.
4. **Email Spoofing**: Register with an unverified email but attempt to access verified-only paths.
5. **Junk Document ID**: Create a document in `users/` with a 1MB string as the ID.
6. **Shadow Field injection**: Adding `isAdmin: true` to a user profile update.
7. **Terminal State Break**: (Not applicable yet)
8. **Orphaned Writes**: Creating a course with a non-existent user reference.
9. **Recursive Cost Attack**: Querying `users` without a filter.
10. **Data PII Leak**: Reading `users/victim` profile as `attacker`.
11. **Immutable Field Change**: Changing `createdAt` after creation.
12. **System Field Injection**: Overwriting AI-generated tips if we had them.

## The Test Runner
(Placeholder for actual test logic)
All payloads should return PERMISSION_DENIED.

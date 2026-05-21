# Security Specification for Gameboxd

## Data Invariants
- A review must belong to a valid game and user.
- A user can only edit their own profile and reviews.
- A follow relationship must have valid user IDs.
- Ratings must be between 1 and 5.
- Likes count must be non-negative.

## The "Dirty Dozen" Payloads

1. **Identity Spoofing (Review)**: Authenticated user A tries to create a review with user B's ID.
2. **Identity Spoofing (Profile)**: Authenticated user A tries to update user B's profile.
3. **Rating Poisoning**: A review with a rating of 100 or -5.
4. **ID Poisoning**: Creating a game with a 2MB string as ID.
5. **State Shortcut (Likes)**: Manually incrementing `likesCount` by 100 in a single update.
6. **Ghost Field Injection**: Adding `isAdmin: true` to a user profile update.
7. **Cross-User Delete**: User A tries to delete User B's review.
8. **PII Leak**: Unauthenticated user tries to read private user fields (if any, currently we don't have private fields, but bio/name are public).
9. **Relational Orphan**: Creating a review for a non-existent game ID (hard to enforce strictly without triggers, but we can check if it exists in rules if we want to be strict).
10. **Resource Exhaustion**: Sending a 1MB string in the `content` of a review.
11. **System Field Overwrite**: User tries to change `createdAt` on an existing review.
12. **Follow Spoofing**: User A tries to create a follow record where `followerId` is User B.

## Test Runner (TDD)
I will implement `firestore.rules.test.ts` after drafting the rules.

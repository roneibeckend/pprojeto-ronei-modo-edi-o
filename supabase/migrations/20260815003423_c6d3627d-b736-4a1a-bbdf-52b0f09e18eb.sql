-- Migration to document relaxed password requirements
-- Requirements updated:
-- - Min length: 8 characters
-- - Characters: letters (upper/lower) and numbers. Special characters optional.
-- - Complexity: at least 2 out of (uppercase, lowercase, numbers).

SELECT 1; -- No-op migration for documentation purposes

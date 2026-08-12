# Plan: Remove Leading Zero-Width Space

The user wants to remove a zero-width space character (`\u2063`) from the beginning of `src/routes/admin.ebooks.tsx`. This character is used as a synthetic neutral anchor and should not be part of the source code.

## Proposed Changes

### Frontend Edits

#### [src/routes/admin.ebooks.tsx]
- Remove the invisible zero-width space at the start of line 1.

#### [src/routes/admin.cursos.tsx]
- Remove the invisible zero-width space at the start of line 1.

## Technical Details
- The character `\u2063` (Invisible Separator) will be removed from the very beginning of the files.

## Verification Plan
- Inspect the first few bytes of the files using `head` to ensure the character is gone.
- Verify the build completes successfully.

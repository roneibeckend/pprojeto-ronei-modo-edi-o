# Plan for Centralizing Pricing Block Text

Centralize all text, values, and badges within the pricing section of the landing page to improve visual focus and consistency across all screen sizes.

## Proposed Changes

### 1. Update Pricing Block Layout in `src/routes/index.tsx`
- Locate the pricing container (around line 1404).
- Change `text-center lg:text-left` to `text-center` to ensure text is centered on all viewports.
- Change `justify-center lg:justify-start` to `justify-center` for the main price display (R$ 47,90).
- Ensure badge containers for "Economize 76%" and installment info are centered within their parent.

## Technical Details

### `src/routes/index.tsx`
- **Pricing Container**: Update the class list of the `div` containing the price details.
- **Price Display**: Update the alignment classes for the `div` containing the currency symbol and large numbers.
- **Badges**: Wrap `inline-flex` badges in a `flex justify-center` container or ensure they are correctly aligned.

## Implementation Steps

1. **Modify `src/routes/index.tsx`**:
    - Update the main pricing info wrapper to use `text-center` exclusively.
    - Adjust the currency/price flex container to use `justify-center` exclusively.
    - Wrap the economy and installment badges in `flex justify-center` divs to ensure they are centered even when the parent container has extra width.
2. **Verification**: Confirm that the pricing block is visually centered in the preview across mobile and desktop widths.

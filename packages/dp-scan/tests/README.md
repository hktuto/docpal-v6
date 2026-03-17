# DP-Scan Test Suite

This folder contains tests for the dp-scan package.

## Running Tests

### Run all tests in this package
```bash
pnpm vitest run packages/dp-scan/composables/useBatchDetail.test.ts
```

### Run with watch mode (for development)
```bash
pnpm vitest packages/dp-scan/composables/useBatchDetail.test.ts
```

### Run with UI
```bash
pnpm vitest --ui packages/dp-scan/composables/useBatchDetail.test.ts
```

## Test Coverage

### Family Classification Logic Tests

The `useBatchDetail.test.ts` file contains comprehensive tests for the Family Category and Class logic:

#### Green Form (G) Tests
- **Single Person Scenarios**: Tests for EFAS date checks, HA/Cert classifications, Clearees categories
- **Family with Members**: Tests for priority schemes (Elderly, Newborn), EFAS logic, Clearees categories

#### White Form (W) Tests
- **Single Person**: Youth schema tests
- **Family with Members**: Priority scheme combinations, Youth schema

#### Edge Cases
- EFAS date boundary tests (14/04/2023)
- Empty/undefined field handling
- Baby count calculations (pregnant family members + applicant)

#### Complete Matrix Tests
Tests that verify specific scenarios from the Excel specification matrix.

## Test Data Structure

Tests use a helper function `createDetail()` to construct test data:

```typescript
const detail = createDetail(
  'G',                                    // formTypeCode: 'G' or 'W'
  {},                                     // overrides
  { PrioritySchemeForElderly: 'Y' },      // priorityScheme
  { HA: 'Y', EFAS: 'Y' },                 // specificField
  [{ FamilyMemberPregnanted16Week: 'N' }], // familyMembers
  { ApplicantFemalePregnanted16week: 'Y' } // applicantInfo
)
```

## Adding New Tests

To add a new test case:

1. Identify the scenario from the Excel matrix
2. Use `createDetail()` with appropriate parameters
3. Assert the expected `familyCategory`, `familyClass`, `priorityIndicator`, and `formSource`

Example:
```typescript
it('should classify as X when condition', () => {
  const detail = createDetail('G', {}, {}, { HA: 'Y' })
  const result = calculateFamilyClassification(detail)
  expect(result.familyCategory).toBe('GF - Green Family')
  expect(result.familyClass).toBe('X - Class Name')
})
```

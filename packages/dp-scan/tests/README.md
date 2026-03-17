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

### `useBatchDetail.test.ts`

The test file is organized into 3 parts, matching the refactored function structure:

#### Part 1: `normalizeDocumentData` (6 tests)
- Remove parentheses from HKID fields
- Remove parentheses from ApplicantChineseName
- Normalize both newResultJson and oldResultJson
- Apply zoneResizeConfig to settings sections
- Handle missing/undefined data gracefully

#### Part 2: `calculateFamilyClassification` (37 tests)
**Green Form (G) Tests:**
- **Single Person (6 tests)**: EFAS date checks, HA/Cert classifications, Clearees categories
- **Family with Members (10 tests)**: Priority schemes, EFAS logic, Clearees categories

**White Form (W) Tests:**
- **Single Person (2 tests)**: Youth schema
- **Family with Members (5 tests)**: Priority schemes, Youth schema

**Edge Cases:**
- EFAS date boundary tests (14/04/2023) - 5 tests
- Baby count calculations - 3 tests
- Complete matrix validation - 6 tests

#### Part 3: `updateDocumentValues` (7 tests)
- Replace `[formClass]` placeholder in oldValue
- Build newValue with correct format
- Handle missing/undefined values
- Include family member HKIDs

## Function Structure

The `DocumentInitFunctionBackup` has been refactored into 3 separate functions:

### 1. `normalizeDocumentData(detail, setting)`
Normalizes document data by:
- Removing parentheses from HKID and ApplicantChineseName fields
- Applying zoneResizeConfig to settings sections

### 2. `calculateFamilyClassification(detail)`
Calculates family classification:
- Returns: `{ familyCategory, familyClass, priorityIndicator, formSource, statePerson }`
- Based on form type (Green/White), priority schemes, and specific fields

### 3. `updateDocumentValues(detail, familyClass)`
Updates document values:
- Replaces `[formClass]` placeholder in oldValue
- Builds newValue string with applicant info and family class

## Test Data Structure

Tests use helper functions to construct test data:

```typescript
// Create detail object
const detail = createDetail(
  'G',                                    // formTypeCode: 'G' or 'W'
  {},                                     // overrides
  { PrioritySchemeForElderly: 'Y' },      // priorityScheme
  { HA: 'Y', EFAS: 'Y' },                 // specificField
  [{ FamilyMemberPregnanted16Week: 'N' }], // familyMembers
  { ApplicantFemalePregnanted16week: 'Y' } // applicantInfo
)

// Create mock setting
const setting = createMockSetting()
```

## Adding New Tests

### Testing Part 1 (Normalization)
```typescript
it('should do something', () => {
  const detail = { /* test data */ }
  const setting = createMockSetting()
  normalizeDocumentData(detail, setting)
  expect(detail.xxx).toBe('expected')
})
```

### Testing Part 2 (Classification)
```typescript
it('should classify as X when condition', () => {
  const detail = createDetail('G', {}, {}, { HA: 'Y' })
  const result = calculateFamilyClassification(detail)
  expect(result.familyCategory).toBe('GF - Green Family')
  expect(result.familyClass).toBe('X - Class Name')
})
```

### Testing Part 3 (Value Updates)
```typescript
it('should update values correctly', () => {
  const detail = { /* test data */ }
  updateDocumentValues(detail, '1S - GF EFAS Elderly & NB')
  expect(detail.newValue).toContain('1S - GF EFAS Elderly & NB')
})
```

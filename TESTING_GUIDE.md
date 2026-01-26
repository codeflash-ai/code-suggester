# Testing Guide for Diff Utils Algorithm

## Quick Start

### Run Comprehensive Test Suite
```bash
# Compile TypeScript
npm run compile

# Run the test runner script
node test-scenarios.js
```

### Run Official Tests
```bash
# Run all tests
npm test

# Run only diff-utils tests
npm test -- test/diff-utils.ts
```

## Test Files

### 1. `test-scenarios.js` - Interactive Test Runner
- **Purpose**: Quick visual testing of key scenarios
- **Output**: Color-coded pass/fail with detailed output
- **Coverage**: 7 critical scenarios
- **Usage**: `node test-scenarios.js`

### 2. `test/diff-utils-comprehensive.ts` - Comprehensive Test Suite
- **Purpose**: Full test coverage with Mocha
- **Coverage**: 30+ test cases covering all edge cases
- **Usage**: `npm test -- test/diff-utils-comprehensive.ts`

### 3. `test/diff-utils.ts` - Original Test Suite
- **Purpose**: Existing regression tests
- **Coverage**: 7 basic scenarios
- **Usage**: `npm test -- test/diff-utils.ts`

## Test Scenarios Covered

### ✅ Single Line Changes
- [x] Single line modification
- [x] Single line addition
- [x] Single line deletion
- [x] At beginning of file
- [x] At end of file
- [x] In middle of file

### ✅ Multiple Line Changes
- [x] Many-to-one (multiple lines → one line)
- [x] One-to-many (one line → multiple lines)
- [x] Many-to-many (multiple lines → multiple lines)
- [x] Multiple deletions
- [x] Multiple additions

### ✅ Edge Cases
- [x] Insertion at line 1
- [x] Deletion at line 1
- [x] Changes at end of file
- [x] No context lines available
- [x] Empty file changes

### ✅ GitHub API Compliance
- [x] Insertion format: `oldEnd < oldStart`
- [x] Deletion format: `newEnd < newStart`
- [x] Single line: `oldStart === oldEnd`
- [x] Context lines: `previousLine` and `nextLine`

### ✅ Buffer Lines (Normal Lines)
- [x] Normal lines included in range
- [x] Normal lines preserved in newContent
- [x] Context lines correctly identified

## Understanding Test Output

### Test Runner Output Format
```
============================================================
Test: Single Line Modification
============================================================

Generated Hunk:
{
  "oldStart": 5,
  "oldEnd": 5,
  "newStart": 5,
  "newEnd": 5,
  "newContent": ["  args: ['sleep', '301']"]
}

Expected:
{
  "oldStart": 5,
  "oldEnd": 5,
  "newStart": 5,
  "newEnd": 5,
  "newContent": ["  args: ['sleep', '301']"]
}

✅ PASSED
```

### Key Fields to Verify

1. **oldStart/oldEnd**: Range in original file
2. **newStart/newEnd**: Range in new file
3. **newContent**: Array of replacement lines
4. **previousLine/nextLine**: Context lines (optional)

## Common Test Patterns

### Testing Single Line Modification
```javascript
const diff = `@@ -5,1 +5,1 @@
-old line
+new line`;

// Expected:
// oldStart: 5, oldEnd: 5
// newStart: 5, newEnd: 5
// newContent: ['new line']
```

### Testing Insertion
```javascript
const diff = `@@ -5,1 +5,2 @@
 context
+inserted line
 next`;

// Expected:
// oldStart: 6, oldEnd: 5 (GitHub API quirk!)
// newStart: 6, newEnd: 6
// newContent: ['inserted line']
```

### Testing Deletion
```javascript
const diff = `@@ -4,2 +4,0 @@
 context
-deleted line
 next`;

// Expected:
// oldStart: 5, oldEnd: 5
// newStart: 5, newEnd: 4 (GitHub API quirk!)
// newContent: []
```

## Debugging Failed Tests

### Step 1: Check the Generated Hunk
```javascript
const hunks = parseAllHunks(diff);
console.log(JSON.stringify(hunks.values().next().value?.[0], null, 2));
```

### Step 2: Verify GitHub API Format
- **Insertions**: `oldEnd < oldStart` ✅
- **Deletions**: `newEnd < newStart` ✅
- **Modifications**: Normal ranges ✅

### Step 3: Check Buffer Lines
Normal lines within the change range should be included in `newContent`.

### Step 4: Verify Context Lines
- `previousLine` should be the normal line at `oldStart - 1`
- `nextLine` should be the normal line at `oldEnd + 1`

## Adding New Tests

### To `test-scenarios.js`:
```javascript
{
  name: 'Your Test Name',
  diff: `diff --git a/file.txt b/file.txt
index 123..456 100644
--- a/file.txt
+++ b/file.txt
@@ -X,Y +X,Y @@
...`,
  expected: {
    oldStart: X,
    oldEnd: Y,
    newStart: X,
    newEnd: Y,
    newContent: ['...'],
  },
}
```

### To `test/diff-utils-comprehensive.ts`:
```typescript
it('describes the scenario', () => {
  const diff = `...`;
  const hunks = parseAllHunks(diff);
  const hunk = hunks.get('file.txt')![0];
  assert.strictEqual(hunk.oldStart, X);
  // ... more assertions
});
```

## Continuous Testing

### Watch Mode (if available)
```bash
npm test -- --watch test/diff-utils.ts
```

### Coverage Report
```bash
npm test -- --coverage
```

## Resources

- **Algorithm Explanation**: See `ALGORITHM_EXPLANATION.md`
- **Before/After Comparison**: See `ALGORITHM_COMPARISON.md`
- **GitHub API Docs**: https://docs.github.com/en/rest/pulls/comments

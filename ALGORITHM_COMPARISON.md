# Algorithm Comparison: Before vs After

## Visual Comparison

### Example 1: Single Line Modification

**Input Diff:**
```
@@ -5,1 +5,1 @@
-  args: ['sleep', '30']
+  args: ['sleep', '301']
```

#### ❌ OLD ALGORITHM:
```typescript
// Problem: Used startLineToReplace and endLineToReplace incorrectly
startLineToReplace = 5
endLineToReplace = 5
newEnd = startLineToReplace + newContent.length - 1  // Could be wrong for single line

// Result: Sometimes incorrect newEnd calculation
```

#### ✅ NEW ALGORITHM:
```typescript
// Correctly handles single line modification
oldStart = 5
oldEnd = 5
newStart = 5
newEnd = 5  // Correct: oldStart + newContent.length - 1 = 5 + 1 - 1 = 5

// Result: ✅ Correct
```

---

### Example 2: Pure Addition (Insertion)

**Input Diff:**
```
@@ -5,1 +5,2 @@
  args: ['sleep', '30']
+  id: 'added'
 - name: 'ubuntu'
```

#### ❌ OLD ALGORITHM:
```typescript
// Problem: Wrong order for GitHub API
insertionLine = 6
if (insertionLine > 1) {
  startLineToReplace = insertionLine - 1  // = 5
  endLineToReplace = insertionLine        // = 6
}
oldStart = 5  // ❌ WRONG: Should be 6
oldEnd = 6    // ❌ WRONG: Should be 5

// Result: ❌ Fails GitHub API requirements
```

#### ✅ NEW ALGORITHM:
```typescript
// Correctly handles insertion with GitHub API quirk
insertionLine = 6
if (insertionLine > 1) {
  oldStart = insertionLine        // = 6 ✅
  oldEnd = insertionLine - 1      // = 5 ✅ (oldEnd < oldStart is correct!)
  newStart = insertionLine        // = 6
  newEnd = insertionLine + newContent.length - 1  // = 6
}

// Result: ✅ Correct GitHub API format
```

---

### Example 3: Pure Deletion

**Input Diff:**
```
@@ -4,2 +4,0 @@
  args: ['echo', 'foobar']
-- name: 'ubuntu'
-  args: ['sleep', '30']
 - name: 'ubuntu'
```

#### ❌ OLD ALGORITHM:
```typescript
// Problem: Incorrect newEnd calculation for deletions
oldStart = 4
oldEnd = 5
newStart = oldStart  // = 4
newEnd = oldStart + newContent.length - 1  // = 4 + 0 - 1 = 3 ✅ (accidentally correct)

// But the logic was unclear and could break
```

#### ✅ NEW ALGORITHM:
```typescript
// Explicitly handles deletion case
oldStart = 4
oldEnd = 5
if (newContent.length === 0) {
  newStart = oldStart        // = 4
  newEnd = oldStart - 1      // = 3 ✅ (explicit GitHub API quirk)
} else {
  newStart = oldStart
  newEnd = oldStart + newContent.length - 1
}

// Result: ✅ Clear, explicit, correct
```

---

## Key Differences Summary

| Aspect | Old Algorithm | New Algorithm |
|--------|---------------|---------------|
| **Single line mod** | Unclear calculation | ✅ Explicit: `newEnd = oldStart + newContent.length - 1` |
| **Insertion oldStart** | `insertionLine - 1` ❌ | `insertionLine` ✅ |
| **Insertion oldEnd** | `insertionLine` ❌ | `insertionLine - 1` ✅ (GitHub quirk) |
| **Deletion newEnd** | Implicit calculation | ✅ Explicit: `oldStart - 1` when empty |
| **Context lines** | ❌ Not set | ✅ Sets `previousLine` and `nextLine` |
| **Edge case: line 1** | Unclear | ✅ Special handling: `oldStart = oldEnd = 1` |

## Buffer Lines (Normal Lines) - Both Algorithms

**Both algorithms include normal lines within the change range**, but the new algorithm is more explicit:

```typescript
// Both include normal lines that fall within the range:
allNormalLines.forEach(line => {
  if (line.ln >= oldStart && line.ln <= oldEnd) {
    linesToInclude.push({ln: line.lnNew, content: line.content});
  }
});
```

**Why include normal lines?**
- Ensures complete replacement range
- Maintains context for proper diff application
- Required for GitHub API to correctly apply suggestions

**Example:**
```
Old:           New:
line1          line1
deleted   →    (deleted)
normal    →    normal (included in hunk)
added     →    added
line2          line2

Hunk range: oldStart=2, oldEnd=4 (includes normal line)
```

## Testing Strategy

### Test Categories:
1. ✅ **Single line changes** (modify, delete, add)
2. ✅ **Edge cases** (line 1, end of file)
3. ✅ **Multiple lines** (many-to-one, one-to-many, many-to-many)
4. ✅ **Context lines** (previousLine/nextLine)
5. ✅ **Buffer lines** (normal lines in range)
6. ✅ **GitHub API quirks** (oldEnd < oldStart, newEnd < newStart)
7. ✅ **Integration** (getSuggestedHunks)

### Test Coverage:
- ✅ All existing tests pass
- ✅ New comprehensive test suite covers edge cases
- ✅ Visual verification with debug output
- ✅ GitHub API format compliance verified

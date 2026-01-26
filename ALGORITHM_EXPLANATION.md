# Diff Utils Algorithm Explanation

## Overview
The `parseAllHunks` function converts a GNU diff format into `Hunk` objects that can be used with GitHub's API for creating review comments and suggestions.

## Key Concepts

### Hunk Structure
A `Hunk` represents a change range with:
- `oldStart`, `oldEnd`: Range in the original file (1-indexed)
- `newStart`, `newEnd`: Range in the new file (1-indexed)
- `newContent`: Array of lines that should replace the old range
- `previousLine`, `nextLine`: Optional context lines (for hunk adjustment)

### GitHub API Quirks
GitHub's API has special requirements:
1. **Insertions**: `oldEnd < oldStart` (e.g., oldStart=6, oldEnd=5 means "insert after line 5")
2. **Deletions**: `newEnd < newStart` (e.g., newStart=4, newEnd=3 means "delete lines 4-5, new file starts at line 4")

## Algorithm Flow

### Phase 1: Parse and Categorize Lines
```typescript
// Collect three types of lines from the diff:
- allAddedLines: Lines marked with '+' (new content)
- allDeletedLines: Lines marked with '-' (removed content)  
- allNormalLines: Lines marked with ' ' (unchanged context)
```

### Phase 2: Determine Change Type

#### Case A: Has Deletions (allDeletedLines.length > 0)

**Step 1: Calculate oldStart and oldEnd**
- Find the range of deleted lines
- Include any normal lines that fall within the change range
- `oldStart = min(line numbers in range)`
- `oldEnd = max(line numbers in range)`

**Step 2: Build newContent**
- Add all added lines (sorted by line number)
- Add normal lines that fall within the replacement range
- Sort by line number to maintain order

**Step 3: Calculate newStart and newEnd**
- If `newContent.length === 0`: Pure deletion
  - `newStart = oldStart`
  - `newEnd = oldStart - 1` (GitHub API quirk)
- Else: Modification or deletion with additions
  - `newStart = oldStart`
  - `newEnd = oldStart + newContent.length - 1`

**Step 4: Find context lines**
- `previousLine = normal line at (oldStart - 1)`
- `nextLine = normal line at (oldEnd + 1)`

#### Case B: Pure Additions (allDeletedLines.length === 0)

**Step 1: Determine insertion point**
- `insertionLine = first added line's line number`

**Step 2: Calculate ranges**
- If `insertionLine > 1`:
  - `oldStart = insertionLine`
  - `oldEnd = insertionLine - 1` (GitHub API quirk for insertions)
  - `newStart = insertionLine`
  - `newEnd = insertionLine + newContent.length - 1`
- Else (inserting at line 1):
  - `oldStart = oldEnd = insertionLine`
  - `newStart = insertionLine`
  - `newEnd = insertionLine + newContent.length - 1`

**Step 3: Find context lines**
- `previousLine = normal line at (insertionLine - 1)`
- `nextLine = normal line at (insertionLine)`

## What Changed from Previous Algorithm

### Previous Issues:
1. **Single line modifications**: Didn't correctly handle 1 deleted + 1 added line
2. **Pure additions**: Used `oldStart = insertionLine - 1, oldEnd = insertionLine` (wrong order)
3. **Pure deletions**: Calculated `newEnd` incorrectly when `newContent` was empty
4. **Missing context**: Didn't set `previousLine` and `nextLine` fields

### Current Fixes:
1. ✅ Properly handles single-line modifications
2. ✅ For insertions: `oldStart = insertionLine, oldEnd = insertionLine - 1` (correct GitHub API format)
3. ✅ For deletions: `newEnd = oldStart - 1` when `newContent.length === 0`
4. ✅ Sets `previousLine` and `nextLine` from normal lines

## Buffer Lines (Normal Lines)

**Yes, we do include buffer/context lines!**

Normal lines (unchanged lines) are included in the hunk range when they fall within the change range. This ensures:
- The hunk includes all lines that need to be replaced
- Context is preserved for proper diff application
- GitHub API receives complete replacement ranges

Example:
```
Old file:
1. line1
2. line2  <- deleted
3. line3  <- deleted  
4. line4  <- normal (included in range)
5. line5

Hunk range: oldStart=2, oldEnd=4 (includes normal line 4)
```

## Edge Cases Handled

1. **Insertion at line 1**: Special handling (oldStart = oldEnd = 1)
2. **Pure deletion**: newEnd < newStart
3. **Pure addition**: oldEnd < oldStart
4. **Single line change**: oldStart = oldEnd, newStart = newEnd
5. **Multiple lines**: Proper range calculation
6. **No context lines**: previousLine/nextLine may be undefined

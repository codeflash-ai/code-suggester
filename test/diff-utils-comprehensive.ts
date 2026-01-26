// Copyright 2020 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {describe, it, before} from 'mocha';
import {setup} from './util';
import {parseAllHunks, getSuggestedHunks} from '../src/utils/diff-utils';
import * as assert from 'assert';

before(() => {
  setup();
});

describe('parseAllHunks - Comprehensive Edge Cases', () => {
  describe('Single Line Changes', () => {
    it('handles single line modification at beginning of file', () => {
      const diff = `diff --git a/file.txt b/file.txt
index 123..456 100644
--- a/file.txt
+++ b/file.txt
@@ -1,3 +1,3 @@
-old line
+new line
 line2
 line3`;
      const hunks = parseAllHunks(diff);
      const hunk = hunks.get('file.txt')![0];
      assert.strictEqual(hunk.oldStart, 1);
      assert.strictEqual(hunk.oldEnd, 1);
      assert.strictEqual(hunk.newStart, 1);
      assert.strictEqual(hunk.newEnd, 1);
      assert.deepStrictEqual(hunk.newContent, ['new line']);
    });

    it('handles single line modification at end of file', () => {
      const diff = `diff --git a/file.txt b/file.txt
index 123..456 100644
--- a/file.txt
+++ b/file.txt
@@ -1,3 +1,3 @@
 line1
 line2
-old line
+new line`;
      const hunks = parseAllHunks(diff);
      const hunk = hunks.get('file.txt')![0];
      assert.strictEqual(hunk.oldStart, 3);
      assert.strictEqual(hunk.oldEnd, 3);
      assert.strictEqual(hunk.newStart, 3);
      assert.strictEqual(hunk.newEnd, 3);
      assert.deepStrictEqual(hunk.newContent, ['new line']);
    });

    it('handles single line deletion', () => {
      const diff = `diff --git a/file.txt b/file.txt
index 123..456 100644
--- a/file.txt
+++ b/file.txt
@@ -1,3 +1,2 @@
 line1
-deleted line
 line2`;
      const hunks = parseAllHunks(diff);
      const hunk = hunks.get('file.txt')![0];
      assert.strictEqual(hunk.oldStart, 2);
      assert.strictEqual(hunk.oldEnd, 2);
      assert.strictEqual(hunk.newStart, 2);
      assert.strictEqual(hunk.newEnd, 1); // GitHub API quirk: newEnd < newStart
      assert.deepStrictEqual(hunk.newContent, []);
    });

    it('handles single line addition', () => {
      const diff = `diff --git a/file.txt b/file.txt
index 123..456 100644
--- a/file.txt
+++ b/file.txt
@@ -1,2 +1,3 @@
 line1
+new line
 line2`;
      const hunks = parseAllHunks(diff);
      const hunk = hunks.get('file.txt')![0];
      assert.strictEqual(hunk.oldStart, 2);
      assert.strictEqual(hunk.oldEnd, 1); // GitHub API quirk: oldEnd < oldStart
      assert.strictEqual(hunk.newStart, 2);
      assert.strictEqual(hunk.newEnd, 2);
      assert.deepStrictEqual(hunk.newContent, ['new line']);
    });
  });

  describe('Insertion Edge Cases', () => {
    it('handles insertion at line 1', () => {
      const diff = `diff --git a/file.txt b/file.txt
index 123..456 100644
--- a/file.txt
+++ b/file.txt
@@ -1,2 +1,3 @@
+new first line
 line1
 line2`;
      const hunks = parseAllHunks(diff);
      const hunk = hunks.get('file.txt')![0];
      assert.strictEqual(hunk.oldStart, 1);
      assert.strictEqual(hunk.oldEnd, 0); // GitHub API quirk: oldEnd < oldStart for insertions
      assert.strictEqual(hunk.newStart, 1);
      assert.strictEqual(hunk.newEnd, 1);
      assert.deepStrictEqual(hunk.newContent, ['new first line']);
    });

    it('handles multiple line insertion', () => {
      const diff = `diff --git a/file.txt b/file.txt
index 123..456 100644
--- a/file.txt
+++ b/file.txt
@@ -1,2 +1,4 @@
 line1
+inserted line 1
+inserted line 2
 line2`;
      const hunks = parseAllHunks(diff);
      const hunk = hunks.get('file.txt')![0];
      assert.strictEqual(hunk.oldStart, 2);
      assert.strictEqual(hunk.oldEnd, 1);
      assert.strictEqual(hunk.newStart, 2);
      assert.strictEqual(hunk.newEnd, 3);
      assert.deepStrictEqual(hunk.newContent, ['inserted line 1', 'inserted line 2']);
    });
  });

  describe('Deletion Edge Cases', () => {
    it('handles multiple line deletion', () => {
      const diff = `diff --git a/file.txt b/file.txt
index 123..456 100644
--- a/file.txt
+++ b/file.txt
@@ -1,4 +1,2 @@
 line1
-deleted line 1
-deleted line 2
 line2`;
      const hunks = parseAllHunks(diff);
      const hunk = hunks.get('file.txt')![0];
      assert.strictEqual(hunk.oldStart, 2);
      assert.strictEqual(hunk.oldEnd, 3);
      assert.strictEqual(hunk.newStart, 2);
      assert.strictEqual(hunk.newEnd, 1); // GitHub API quirk
      assert.deepStrictEqual(hunk.newContent, []);
    });

    it('handles deletion at beginning of file', () => {
      const diff = `diff --git a/file.txt b/file.txt
index 123..456 100644
--- a/file.txt
+++ b/file.txt
@@ -1,3 +1,2 @@
-deleted line
 line1
 line2`;
      const hunks = parseAllHunks(diff);
      const hunk = hunks.get('file.txt')![0];
      assert.strictEqual(hunk.oldStart, 1);
      assert.strictEqual(hunk.oldEnd, 1);
      assert.strictEqual(hunk.newStart, 1);
      assert.strictEqual(hunk.newEnd, 0); // GitHub API quirk: newEnd < newStart
      assert.deepStrictEqual(hunk.newContent, []);
    });
  });

  describe('Modification Edge Cases', () => {
    it('handles one-to-many modification (1 line becomes multiple)', () => {
      const diff = `diff --git a/file.txt b/file.txt
index 123..456 100644
--- a/file.txt
+++ b/file.txt
@@ -1,3 +1,4 @@
 line1
-old line
+new line 1
+new line 2
 line2`;
      const hunks = parseAllHunks(diff);
      const hunk = hunks.get('file.txt')![0];
      assert.strictEqual(hunk.oldStart, 2);
      assert.strictEqual(hunk.oldEnd, 2);
      assert.strictEqual(hunk.newStart, 2);
      assert.strictEqual(hunk.newEnd, 3);
      assert.deepStrictEqual(hunk.newContent, ['new line 1', 'new line 2']);
    });

    it('handles many-to-one modification (multiple lines become 1)', () => {
      const diff = `diff --git a/file.txt b/file.txt
index 123..456 100644
--- a/file.txt
+++ b/file.txt
@@ -1,4 +1,3 @@
 line1
-old line 1
-old line 2
+new line
 line2`;
      const hunks = parseAllHunks(diff);
      const hunk = hunks.get('file.txt')![0];
      assert.strictEqual(hunk.oldStart, 2);
      assert.strictEqual(hunk.oldEnd, 3);
      assert.strictEqual(hunk.newStart, 2);
      assert.strictEqual(hunk.newEnd, 2);
      assert.deepStrictEqual(hunk.newContent, ['new line']);
    });

    it('handles many-to-many modification', () => {
      const diff = `diff --git a/file.txt b/file.txt
index 123..456 100644
--- a/file.txt
+++ b/file.txt
@@ -1,4 +1,4 @@
 line1
-old line 1
-old line 2
+new line 1
+new line 2
 line2`;
      const hunks = parseAllHunks(diff);
      const hunk = hunks.get('file.txt')![0];
      assert.strictEqual(hunk.oldStart, 2);
      assert.strictEqual(hunk.oldEnd, 3);
      assert.strictEqual(hunk.newStart, 2);
      assert.strictEqual(hunk.newEnd, 3);
      assert.deepStrictEqual(hunk.newContent, ['new line 1', 'new line 2']);
    });
  });

  describe('Context Lines (previousLine/nextLine)', () => {
    it('sets previousLine and nextLine correctly for modification', () => {
      const diff = `diff --git a/file.txt b/file.txt
index 123..456 100644
--- a/file.txt
+++ b/file.txt
@@ -1,4 +1,4 @@
 context before
-old line
+new line
 context after`;
      const hunks = parseAllHunks(diff);
      const hunk = hunks.get('file.txt')![0];
      assert.strictEqual(hunk.previousLine, 'context before');
      assert.strictEqual(hunk.nextLine, 'context after');
    });

    it('sets previousLine for insertion', () => {
      const diff = `diff --git a/file.txt b/file.txt
index 123..456 100644
--- a/file.txt
+++ b/file.txt
@@ -1,2 +1,3 @@
 context before
+new line
 context after`;
      const hunks = parseAllHunks(diff);
      const hunk = hunks.get('file.txt')![0];
      assert.strictEqual(hunk.previousLine, 'context before');
      assert.strictEqual(hunk.nextLine, 'context after');
    });

    it('handles missing context lines gracefully', () => {
      const diff = `diff --git a/file.txt b/file.txt
index 123..456 100644
--- a/file.txt
+++ b/file.txt
@@ -1,1 +1,1 @@
-old line
+new line`;
      const hunks = parseAllHunks(diff);
      const hunk = hunks.get('file.txt')![0];
      // No context lines in single-line file
      assert.strictEqual(hunk.previousLine, undefined);
      assert.strictEqual(hunk.nextLine, undefined);
    });
  });

  describe('Normal Lines (Buffer Lines) Inclusion', () => {
    it('includes normal lines within the change range', () => {
      const diff = `diff --git a/file.txt b/file.txt
index 123..456 100644
--- a/file.txt
+++ b/file.txt
@@ -1,5 +1,5 @@
 line1
-deleted line
 normal line (included)
+new line
 line2`;
      const hunks = parseAllHunks(diff);
      const hunk = hunks.get('file.txt')![0];
      // The range should include the normal line between deleted and added
      assert.ok(hunk.oldStart <= 2);
      assert.ok(hunk.oldEnd >= 3);
      // newContent should include the normal line
      assert.ok(hunk.newContent.includes('normal line (included)'));
    });
  });

  describe('getSuggestedHunks Integration', () => {
    it('handles single line change via getSuggestedHunks', () => {
      const oldContent = 'line1\nold line\nline2';
      const newContent = 'line1\nnew line\nline2';
      const hunks = getSuggestedHunks(oldContent, newContent);
      assert.strictEqual(hunks.length, 1);
      const hunk = hunks[0];
      assert.strictEqual(hunk.oldStart, 2);
      assert.strictEqual(hunk.oldEnd, 2);
      assert.strictEqual(hunk.newStart, 2);
      assert.strictEqual(hunk.newEnd, 2);
      assert.deepStrictEqual(hunk.newContent, ['new line']);
    });

    it('handles insertion via getSuggestedHunks', () => {
      const oldContent = 'line1\nline2';
      const newContent = 'line1\ninserted\nline2';
      const hunks = getSuggestedHunks(oldContent, newContent);
      assert.strictEqual(hunks.length, 1);
      const hunk = hunks[0];
      assert.strictEqual(hunk.oldStart, 2);
      assert.strictEqual(hunk.oldEnd, 1); // GitHub API quirk
      assert.strictEqual(hunk.newStart, 2);
      assert.strictEqual(hunk.newEnd, 2);
    });

    it('handles deletion via getSuggestedHunks', () => {
      const oldContent = 'line1\ndeleted\nline2';
      const newContent = 'line1\nline2';
      const hunks = getSuggestedHunks(oldContent, newContent);
      assert.strictEqual(hunks.length, 1);
      const hunk = hunks[0];
      assert.strictEqual(hunk.oldStart, 2);
      assert.strictEqual(hunk.oldEnd, 2);
      assert.strictEqual(hunk.newStart, 2);
      assert.strictEqual(hunk.newEnd, 1); // GitHub API quirk
      assert.deepStrictEqual(hunk.newContent, []);
    });
  });

  describe('Complex Scenarios', () => {
    it('handles changes with multiple normal lines in range', () => {
      const diff = `diff --git a/file.txt b/file.txt
index 123..456 100644
--- a/file.txt
+++ b/file.txt
@@ -1,6 +1,6 @@
 line1
-deleted
 normal1
 normal2
+added
 line2`;
      const hunks = parseAllHunks(diff);
      const hunk = hunks.get('file.txt')![0];
      // Should include normal1 and normal2 in the range
      assert.ok(hunk.newContent.includes('normal1'));
      assert.ok(hunk.newContent.includes('normal2'));
      assert.ok(hunk.newContent.includes('added'));
    });

    it('handles non-contiguous changes in same chunk', () => {
      // Note: parse-diff typically groups nearby changes into chunks
      // This test verifies the algorithm handles all changes in a chunk
      const diff = `diff --git a/file.txt b/file.txt
index 123..456 100644
--- a/file.txt
+++ b/file.txt
@@ -1,5 +1,5 @@
 line1
-deleted1
+added1
 normal
-deleted2
+added2
 line2`;
      const hunks = parseAllHunks(diff);
      // Should create one hunk covering the entire range
      const hunk = hunks.get('file.txt')![0];
      assert.ok(hunk.oldStart <= 2);
      assert.ok(hunk.oldEnd >= 4);
    });
  });
});

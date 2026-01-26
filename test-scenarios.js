#!/usr/bin/env node
/**
 * Test Runner for Diff Utils - Comprehensive Scenario Testing
 * 
 * This script helps test all scenarios for the diff-utils algorithm.
 * Run with: node test-scenarios.js
 */

const {parseAllHunks, getSuggestedHunks} = require('./build/src/utils/diff-utils');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function testScenario(name, diff, expected) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`Test: ${name}`, 'blue');
  log('='.repeat(60), 'cyan');
  
  try {
    const hunks = parseAllHunks(diff);
    const hunk = hunks.values().next().value?.[0];
    
    if (!hunk) {
      log('❌ FAILED: No hunk generated', 'red');
      return false;
    }
    
    log(`\nGenerated Hunk:`, 'yellow');
    console.log(JSON.stringify(hunk, null, 2));
    
    log(`\nExpected:`, 'yellow');
    console.log(JSON.stringify(expected, null, 2));
    
    const passed = 
      hunk.oldStart === expected.oldStart &&
      hunk.oldEnd === expected.oldEnd &&
      hunk.newStart === expected.newStart &&
      hunk.newEnd === expected.newEnd &&
      JSON.stringify(hunk.newContent) === JSON.stringify(expected.newContent);
    
    if (passed) {
      log('\n✅ PASSED', 'green');
      return true;
    } else {
      log('\n❌ FAILED', 'red');
      log(`  oldStart: ${hunk.oldStart} (expected ${expected.oldStart})`, 'red');
      log(`  oldEnd: ${hunk.oldEnd} (expected ${expected.oldEnd})`, 'red');
      log(`  newStart: ${hunk.newStart} (expected ${expected.newStart})`, 'red');
      log(`  newEnd: ${hunk.newEnd} (expected ${expected.newEnd})`, 'red');
      return false;
    }
  } catch (error) {
    log(`\n❌ ERROR: ${error.message}`, 'red');
    return false;
  }
}

// Test Scenarios
const scenarios = [
  {
    name: 'Single Line Modification',
    diff: `diff --git a/file.txt b/file.txt
index 123..456 100644
--- a/file.txt
+++ b/file.txt
@@ -5,1 +5,1 @@
-  args: ['sleep', '30']
+  args: ['sleep', '301']`,
    expected: {
      oldStart: 5,
      oldEnd: 5,
      newStart: 5,
      newEnd: 5,
      newContent: ["  args: ['sleep', '301']"],
    },
  },
  {
    name: 'Single Line Addition',
    diff: `diff --git a/file.txt b/file.txt
index 123..456 100644
--- a/file.txt
+++ b/file.txt
@@ -5,1 +5,2 @@
  args: ['sleep', '30']
+  id: 'added'`,
    expected: {
      oldStart: 6,
      oldEnd: 5, // GitHub API quirk: oldEnd < oldStart
      newStart: 6,
      newEnd: 6,
      newContent: ["  id: 'added'"],
    },
  },
  {
    name: 'Single Line Deletion',
    diff: `diff --git a/file.txt b/file.txt
index 123..456 100644
--- a/file.txt
+++ b/file.txt
@@ -4,2 +4,1 @@
  args: ['echo', 'foobar']
-deleted line
 - name: 'ubuntu'`,
    expected: {
      oldStart: 5,
      oldEnd: 5,
      newStart: 5,
      newEnd: 4, // GitHub API quirk: newEnd < newStart
      newContent: [],
    },
  },
  {
    name: 'Multiple Line Deletion',
    diff: `diff --git a/file.txt b/file.txt
index 123..456 100644
--- a/file.txt
+++ b/file.txt
@@ -4,2 +4,0 @@
  args: ['echo', 'foobar']
-deleted line 1
-deleted line 2
 - name: 'ubuntu'`,
    expected: {
      oldStart: 5,
      oldEnd: 6,
      newStart: 5,
      newEnd: 4, // GitHub API quirk: newEnd < newStart
      newContent: [],
    },
  },
  {
    name: 'One-to-Many Modification',
    diff: `diff --git a/file.txt b/file.txt
index 123..456 100644
--- a/file.txt
+++ b/file.txt
@@ -5,1 +5,2 @@
-old line
+new line 1
+new line 2`,
    expected: {
      oldStart: 5,
      oldEnd: 5,
      newStart: 5,
      newEnd: 6,
      newContent: ['new line 1', 'new line 2'],
    },
  },
  {
    name: 'Many-to-One Modification',
    diff: `diff --git a/file.txt b/file.txt
index 123..456 100644
--- a/file.txt
+++ b/file.txt
@@ -2,4 +2,2 @@
 line1
-old line 1
-old line 2
+new line
 line2`,
    expected: {
      oldStart: 3, // Includes normal line "line1" in range
      oldEnd: 4,   // Includes deleted lines
      newStart: 3,
      newEnd: 3,   // Single replacement line
      newContent: ['new line'],
    },
  },
  {
    name: 'Insertion at Line 1',
    diff: `diff --git a/file.txt b/file.txt
index 123..456 100644
--- a/file.txt
+++ b/file.txt
@@ -1,2 +1,3 @@
+new first line
 line1
 line2`,
    expected: {
      oldStart: 1,
      oldEnd: 0, // GitHub API quirk: oldEnd < oldStart for insertions (even at line 1)
      newStart: 1,
      newEnd: 1,
      newContent: ['new first line'],
    },
  },
];

// Run all tests
log('\n🧪 Running Comprehensive Diff Utils Tests\n', 'cyan');
let passed = 0;
let failed = 0;

scenarios.forEach((scenario, index) => {
  const result = testScenario(scenario.name, scenario.diff, scenario.expected);
  if (result) {
    passed++;
  } else {
    failed++;
  }
});

// Summary
log(`\n${'='.repeat(60)}`, 'cyan');
log('Test Summary', 'blue');
log('='.repeat(60), 'cyan');
log(`Total: ${scenarios.length}`, 'yellow');
log(`✅ Passed: ${passed}`, 'green');
log(`❌ Failed: ${failed}`, failed > 0 ? 'red' : 'green');
log('='.repeat(60), 'cyan');

process.exit(failed > 0 ? 1 : 0);

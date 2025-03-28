const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { getRawSuggestionHunks, partitionSuggestedHunksByScope } = require('../build/src/utils/hunk-utils');
const { parsePatch } = require('../build/src/utils/diff-utils');

// Read test files
const prFile = fs.readFileSync(path.join(__dirname, 'fixtures/new-file-test/pr-file.py'), 'utf8');
const suggestionFile = fs.readFileSync(path.join(__dirname, 'fixtures/new-file-test/suggestion-file.py'), 'utf8');

// Create a diff content map like the one used in the real code
const diffContents = new Map();
diffContents.set('common_tags.py', {
  oldContent: prFile,
  newContent: suggestionFile
});

// Simulate a PR hunk for a newly added file
const prHunks = new Map();
prHunks.set('common_tags.py', [{
  oldStart: 0,
  oldEnd: 0,
  newStart: 1,
  newEnd: prFile.split('\n').length,
  oldContent: [],
  newContent: prFile.split('\n')
}]);

// Get the suggested hunks
const suggestedHunks = getRawSuggestionHunks(diffContents);

// Partition the hunks using the current implementation
const result = partitionSuggestedHunksByScope(prHunks, suggestedHunks);

// Log results
console.log('PR Hunks:', prHunks);
console.log('Suggested Hunks:', suggestedHunks);
console.log('Valid Hunks:', result.validHunks);
console.log('Invalid Hunks:', result.invalidHunks);

// Verify expectations
assert(result.validHunks.has('common_tags.py'), 'Should have valid hunks for common_tags.py');
assert(result.validHunks.get('common_tags.py').length > 0, 'Should have at least one valid hunk');
assert(result.invalidHunks.size === 0, 'Should have no invalid hunks');

console.log('✅ Test passed!');

const { getSuggestedHunks } = require('./build/src/utils/diff-utils');
const { createPatch } = require('diff');

// Test case: Pure addition at line 4
const oldContent = `line1
line2
line3
line5`;

const newContent = `line1
line2
line3
line4
line5`;

console.log('Testing simple addition...');

// First let's see what the diff looks like
const diff = createPatch('test', oldContent, newContent);
console.log('Generated diff:');
console.log(diff);
console.log('');

const hunks = getSuggestedHunks(oldContent, newContent);

console.log('Generated hunks:');
hunks.forEach((hunk, i) => {
    console.log(`Hunk ${i + 1}:`, hunk);
    console.log(`  oldStart: ${hunk.oldStart}, oldEnd: ${hunk.oldEnd}`);
    console.log(`  newStart: ${hunk.newStart}, newEnd: ${hunk.newEnd}`);
    console.log(`  GitHub API compatible: ${hunk.oldStart < hunk.oldEnd ? 'YES' : (hunk.oldStart === hunk.oldEnd ? 'SINGLE LINE' : 'NO')}`);
    console.log(`  newContent:`, hunk.newContent);
    console.log('');
});
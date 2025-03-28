// test-suggester.js
const {Octokit} = require('@octokit/rest');
const {reviewPullRequest} = require('./build/src/index.js'); // Updated path
const fs = require('fs');

// Mock Octokit to avoid needing a real GitHub connection
class MockOctokit {
  constructor() {
    this.pulls = {
      get: async () => ({data: {head: {sha: 'mock-sha'}}}),
      listFiles: async () => ({
        data: [
          {
            filename: 'common_tags.py',
            patch: `@@ -1,10 +1,10 @@
from __future__ import annotations


def find_common_tags(articles: list[dict[str, list[str]]]) -> set[str]:
    if not articles:
        return set()

    common_tags = articles[0]["tags"]
    for article in articles[1:]:
        common_tags = [tag for tag in common_tags if tag in article["tags"]]
    return set(common_tags)`,
          },
        ],
      }),
      createReview: async params => {
        // This is where we can examine what code-suggester is trying to do
        console.log('Creating review with these parameters:');
        console.log(JSON.stringify(params, null, 2));

        // Save the suggestion parameters to a file for examination
        fs.writeFileSync(
          'suggestion-output.json',
          JSON.stringify(params, null, 2)
        );

        return {data: {id: 12345}};
      },
    };

    this.rest = this.pulls;
  }
}

async function testCodeSuggester() {
  // Use mock Octokit instead of real one
  const octokit = new MockOctokit();

  // Define the same file changes
  const diffContents = new Map();
  diffContents.set('common_tags.py', {
    oldContent: `from __future__ import annotations


def find_common_tags(articles: list[dict[str, list[str]]]) -> set[str]:
    if not articles:
        return set()

    common_tags = articles[0]["tags"]
    for article in articles[1:]:
        common_tags = [tag for tag in common_tags if tag in article["tags"]]
    return set(common_tags)`,

    newContent: `from __future__ import annotations


def find_common_tags(articles: list[dict[str, list[str]]]) -> set[str]:
    if not articles:
        return set()

    common_tags = set(articles[0]["tags"])
    for article in articles[1:]:
        common_tags.intersection_update(article["tags"])
    return common_tags`,
  });

  try {
    console.log('Testing code-suggester with updated diff package...');

    // Use fake repository and PR info
    const result = await reviewPullRequest(octokit, diffContents, {
      owner: 'test-owner',
      repo: 'test-repo',
      pullNumber: 1,
      pageSize: 100,
    });

    console.log('\nReview completed successfully!');
    console.log('Review ID:', result);
    console.log(
      '\nCheck suggestion-output.json for the full details of what was sent to GitHub'
    );

    // Look at the suggestion body to see if it includes both changes
    const outputFile = fs.readFileSync('suggestion-output.json', 'utf8');
    const output = JSON.parse(outputFile);

    if (output.comments && output.comments.length > 0) {
      console.log('\nSuggestion body:');
      output.comments.forEach((comment, i) => {
        console.log(`\nComment #${i + 1}:`);
        console.log(comment.body);

        // Check if return statement is in the suggestion
        const hasReturnLine = comment.body.includes('return common_tags');
        const hasAssignmentLine = comment.body.includes('common_tags = set(');

        if (hasReturnLine && hasAssignmentLine) {
          console.log(
            '\n✅ SUCCESS: Both assignment and return statement are in the same suggestion!'
          );
        } else {
          console.log('\n❌ ISSUE: Missing important changes in suggestion');
          if (!hasReturnLine) console.log('  - Missing return statement');
          if (!hasAssignmentLine)
            console.log('  - Missing assignment statement');
        }
      });
    } else {
      console.log('\n❌ No suggestions were created!');
    }
  } catch (error) {
    console.error('Error testing code-suggester:', error);
  }
}

testCodeSuggester();

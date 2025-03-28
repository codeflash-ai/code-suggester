const {Octokit} = require('@octokit/rest');
const {reviewPullRequest} = require('./build/src/index.js');

async function testCodeSuggester() {
  // Use your GitHub token
  const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
  });

  const diffContents = new Map();
  diffContents.set('common_tags.py', {
    // Original code
    oldContent: `def get_tts_config(session_id: str, openai_key: str) -> TTSConfig:
    """Get or create a TTSConfig instance for the given session_id."""
    if session_id is None:
        msg = "session_id cannot be None"
        raise ValueError(msg)

    if session_id not in tts_config_cache:
        tts_config_cache[session_id] = TTSConfig(session_id, openai_key)
    return tts_config_cache[session_id]`,

    // Improved code you want to suggest
    newContent: `def get_tts_config(session_id: str, openai_key: str) -> TTSConfig:
    """Get or create a TTSConfig instance for the given session_id."""
    if session_id is None:
        raise ValueError("session_id cannot be None")

    try:
        return tts_config_cache[session_id]
    except KeyError:
        tts_config = TTSConfig(session_id, openai_key)
        tts_config_cache[session_id] = tts_config
        return tts_config`,
  });

  try {
    // Replace with your GitHub username and PR number
    const result = await reviewPullRequest(octokit, diffContents, {
      owner: 'saga4', // Replace with your GitHub username
      repo: 'my-best-repo',
      pullNumber: 4, // The PR number from Step 1
      pageSize: 100,
    });

    console.log('Review created successfully:', result);
  } catch (error) {
    console.error('Error creating review:', error);
    console.error(error.stack);
  }
}

testCodeSuggester();

// expose-internals.js
const diffUtils = require('./build/src/utils/diff-utils.js');
const reviewPullRequest = require('./build/src/github/review-pull-request.js');

module.exports = {
  getSuggestedHunks: diffUtils.getSuggestedHunks,
  determineValidHunks: reviewPullRequest.determineValidHunks,
};

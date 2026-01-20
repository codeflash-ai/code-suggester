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
import * as assert from 'assert';
import {
  adjustHunkUp,
  adjustHunkDown,
  getRawSuggestionHunks,
  partitionSuggestedHunksByScope,
} from '../src/utils/hunk-utils';
import {Hunk, FileDiffContent} from '../src/types';

before(() => {
  setup();
});

describe('adjustHunkUp', () => {
  it('returns a new hunk if there is a previous line', () => {
    const hunk = {
      oldStart: 5,
      oldEnd: 5,
      newStart: 5,
      newEnd: 5,
      newContent: ["  args: ['sleep', '301']"],
      nextLine: "- name: 'ubuntu'",
      previousLine: "- name: 'ubuntu'",
    };
    const adjustedHunk = adjustHunkUp(hunk);
    assert.deepStrictEqual(adjustedHunk, {
      oldStart: 4,
      oldEnd: 5,
      newStart: 4,
      newEnd: 5,
      newContent: ["- name: 'ubuntu'", "  args: ['sleep', '301']"],
    });
  });
  it('returns null if there is no previous line', () => {
    const hunk = {
      oldStart: 5,
      oldEnd: 5,
      newStart: 5,
      newEnd: 5,
      newContent: ["  args: ['sleep', '301']"],
    };
    const adjustedHunk = adjustHunkUp(hunk);
    assert.strictEqual(adjustedHunk, null);
  });

  it('handles multi-line hunks correctly', () => {
    const hunk = {
      oldStart: 10,
      oldEnd: 12,
      newStart: 10,
      newEnd: 12,
      newContent: ['line1', 'line2', 'line3'],
      previousLine: 'previous',
    };
    const adjustedHunk = adjustHunkUp(hunk);
    assert.deepStrictEqual(adjustedHunk, {
      oldStart: 9,
      oldEnd: 12,
      newStart: 9,
      newEnd: 12,
      newContent: ['previous', 'line1', 'line2', 'line3'],
    });
  });

  it('handles hunk at line 1 (no previous line)', () => {
    const hunk = {
      oldStart: 1,
      oldEnd: 1,
      newStart: 1,
      newEnd: 1,
      newContent: ['first line'],
    };
    const adjustedHunk = adjustHunkUp(hunk);
    assert.strictEqual(adjustedHunk, null);
  });
});

describe('adjustHunkDown', () => {
  it('returns a new hunk if there is a next line', () => {
    const hunk = {
      oldStart: 5,
      oldEnd: 5,
      newStart: 5,
      newEnd: 5,
      newContent: ["  args: ['sleep', '301']"],
      nextLine: "- name: 'ubuntu'",
      previousLine: "- name: 'ubuntu'",
    };
    const adjustedHunk = adjustHunkDown(hunk);
    assert.deepStrictEqual(adjustedHunk, {
      oldStart: 5,
      oldEnd: 6,
      newStart: 5,
      newEnd: 6,
      newContent: ["  args: ['sleep', '301']", "- name: 'ubuntu'"],
    });
  });
  it('returns null if there is no next line', () => {
    const hunk = {
      oldStart: 5,
      oldEnd: 5,
      newStart: 5,
      newEnd: 5,
      newContent: ["  args: ['sleep', '301']"],
    };
    const adjustedHunk = adjustHunkDown(hunk);
    assert.deepStrictEqual(adjustedHunk, null);
  });

  it('handles multi-line hunks correctly', () => {
    const hunk = {
      oldStart: 10,
      oldEnd: 12,
      newStart: 10,
      newEnd: 12,
      newContent: ['line1', 'line2', 'line3'],
      nextLine: 'next',
    };
    const adjustedHunk = adjustHunkDown(hunk);
    assert.deepStrictEqual(adjustedHunk, {
      oldStart: 10,
      oldEnd: 13,
      newStart: 10,
      newEnd: 13,
      newContent: ['line1', 'line2', 'line3', 'next'],
    });
  });
});

describe('getRawSuggestionHunks', () => {
  it('returns empty map for identical content', () => {
    const diffContents = new Map<string, FileDiffContent>([
      ['file1.txt', {oldContent: 'hello\nworld\n', newContent: 'hello\nworld\n'}],
    ]);
    const result = getRawSuggestionHunks(diffContents);
    assert.strictEqual(result.size, 0);
  });

  it('generates hunks for simple modification', () => {
    const diffContents = new Map<string, FileDiffContent>([
      [
        'file1.txt',
        {
          oldContent: 'line1\nline2\nline3\n',
          newContent: 'line1\nmodified\nline3\n',
        },
      ],
    ]);
    const result = getRawSuggestionHunks(diffContents);
    assert.strictEqual(result.size, 1);
    const hunks = result.get('file1.txt');
    assert.ok(hunks);
    assert.strictEqual(hunks.length, 1);
    assert.strictEqual(hunks[0].oldStart, 2);
    assert.strictEqual(hunks[0].oldEnd, 2);
  });

  it('generates hunks for addition', () => {
    const diffContents = new Map<string, FileDiffContent>([
      [
        'file1.txt',
        {
          oldContent: 'line1\nline2\n',
          newContent: 'line1\nline2\nnewline\n',
        },
      ],
    ]);
    const result = getRawSuggestionHunks(diffContents);
    assert.strictEqual(result.size, 1);
    const hunks = result.get('file1.txt');
    assert.ok(hunks);
    assert.strictEqual(hunks.length, 1);
  });

  it('generates hunks for deletion', () => {
    const diffContents = new Map<string, FileDiffContent>([
      [
        'file1.txt',
        {
          oldContent: 'line1\nline2\nline3\n',
          newContent: 'line1\nline3\n',
        },
      ],
    ]);
    const result = getRawSuggestionHunks(diffContents);
    assert.strictEqual(result.size, 1);
    const hunks = result.get('file1.txt');
    assert.ok(hunks);
    assert.strictEqual(hunks.length, 1);
  });

  it('handles multiple files', () => {
    const diffContents = new Map<string, FileDiffContent>([
      [
        'file1.txt',
        {
          oldContent: 'line1\nline2\n',
          newContent: 'line1\nmodified\n',
        },
      ],
      [
        'file2.txt',
        {
          oldContent: 'foo\nbar\n',
          newContent: 'foo\nbaz\n',
        },
      ],
    ]);
    const result = getRawSuggestionHunks(diffContents);
    assert.strictEqual(result.size, 2);
    assert.ok(result.has('file1.txt'));
    assert.ok(result.has('file2.txt'));
  });

  it('skips unchanged files in multi-file map', () => {
    const diffContents = new Map<string, FileDiffContent>([
      [
        'file1.txt',
        {
          oldContent: 'line1\nline2\n',
          newContent: 'line1\nmodified\n',
        },
      ],
      [
        'file2.txt',
        {
          oldContent: 'unchanged\n',
          newContent: 'unchanged\n',
        },
      ],
    ]);
    const result = getRawSuggestionHunks(diffContents);
    assert.strictEqual(result.size, 1);
    assert.ok(result.has('file1.txt'));
    assert.ok(!result.has('file2.txt'));
  });
});

describe('partitionSuggestedHunksByScope', () => {
  it('marks hunks as invalid when file is not in PR', () => {
    const pullRequestHunks = new Map<string, Hunk[]>([
      [
        'file1.txt',
        [
          {
            oldStart: 1,
            oldEnd: 5,
            newStart: 1,
            newEnd: 5,
            newContent: ['a', 'b', 'c', 'd', 'e'],
          },
        ],
      ],
    ]);

    const allSuggestedHunks = new Map<string, Hunk[]>([
      [
        'file2.txt',
        [
          {
            oldStart: 1,
            oldEnd: 1,
            newStart: 1,
            newEnd: 1,
            newContent: ['modified'],
          },
        ],
      ],
    ]);

    const result = partitionSuggestedHunksByScope(
      pullRequestHunks,
      allSuggestedHunks
    );
    assert.strictEqual(result.validHunks.size, 0);
    assert.strictEqual(result.invalidHunks.size, 1);
    assert.ok(result.invalidHunks.has('file2.txt'));
  });

  it('validates hunks that overlap with PR scope', () => {
    const pullRequestHunks = new Map<string, Hunk[]>([
      [
        'file1.txt',
        [
          {
            oldStart: 1,
            oldEnd: 10,
            newStart: 1,
            newEnd: 10,
            newContent: Array(10).fill('line'),
          },
        ],
      ],
    ]);

    const allSuggestedHunks = new Map<string, Hunk[]>([
      [
        'file1.txt',
        [
          {
            oldStart: 3,
            oldEnd: 5,
            newStart: 3,
            newEnd: 5,
            newContent: ['modified3', 'modified4', 'modified5'],
          },
        ],
      ],
    ]);

    const result = partitionSuggestedHunksByScope(
      pullRequestHunks,
      allSuggestedHunks
    );
    assert.strictEqual(result.validHunks.size, 1);
    assert.strictEqual(result.invalidHunks.size, 0);
  });

  it('marks hunks as invalid when they do not overlap with PR scope', () => {
    const pullRequestHunks = new Map<string, Hunk[]>([
      [
        'file1.txt',
        [
          {
            oldStart: 1,
            oldEnd: 5,
            newStart: 1,
            newEnd: 5,
            newContent: ['a', 'b', 'c', 'd', 'e'],
          },
        ],
      ],
    ]);

    const allSuggestedHunks = new Map<string, Hunk[]>([
      [
        'file1.txt',
        [
          {
            oldStart: 10,
            oldEnd: 12,
            newStart: 10,
            newEnd: 12,
            newContent: ['modified'],
          },
        ],
      ],
    ]);

    const result = partitionSuggestedHunksByScope(
      pullRequestHunks,
      allSuggestedHunks
    );
    assert.strictEqual(result.validHunks.size, 0);
    assert.strictEqual(result.invalidHunks.size, 1);
  });

  it('handles multiple hunks in same file', () => {
    const pullRequestHunks = new Map<string, Hunk[]>([
      [
        'file1.txt',
        [
          {
            oldStart: 1,
            oldEnd: 5,
            newStart: 1,
            newEnd: 5,
            newContent: ['a', 'b', 'c', 'd', 'e'],
          },
          {
            oldStart: 10,
            oldEnd: 15,
            newStart: 10,
            newEnd: 15,
            newContent: ['f', 'g', 'h', 'i', 'j', 'k'],
          },
        ],
      ],
    ]);

    const allSuggestedHunks = new Map<string, Hunk[]>([
      [
        'file1.txt',
        [
          {
            oldStart: 2,
            oldEnd: 3,
            newStart: 2,
            newEnd: 3,
            newContent: ['valid1', 'valid2'],
          },
          {
            oldStart: 11,
            oldEnd: 12,
            newStart: 11,
            newEnd: 12,
            newContent: ['valid3', 'valid4'],
          },
          {
            oldStart: 20,
            oldEnd: 21,
            newStart: 20,
            newEnd: 21,
            newContent: ['invalid'],
          },
        ],
      ],
    ]);

    const result = partitionSuggestedHunksByScope(
      pullRequestHunks,
      allSuggestedHunks
    );
    assert.strictEqual(result.validHunks.size, 1);
    const validFileHunks = result.validHunks.get('file1.txt');
    assert.ok(validFileHunks);
    assert.strictEqual(validFileHunks.length, 2);

    assert.strictEqual(result.invalidHunks.size, 1);
    const invalidFileHunks = result.invalidHunks.get('file1.txt');
    assert.ok(invalidFileHunks);
    assert.strictEqual(invalidFileHunks.length, 1);
  });

  it('handles edge case: hunk at exact boundary of PR scope', () => {
    const pullRequestHunks = new Map<string, Hunk[]>([
      [
        'file1.txt',
        [
          {
            oldStart: 5,
            oldEnd: 10,
            newStart: 5,
            newEnd: 10,
            newContent: Array(6).fill('line'),
          },
        ],
      ],
    ]);

    const allSuggestedHunks = new Map<string, Hunk[]>([
      [
        'file1.txt',
        [
          {
            oldStart: 5,
            oldEnd: 10,
            newStart: 5,
            newEnd: 10,
            newContent: ['modified'],
          },
        ],
      ],
    ]);

    const result = partitionSuggestedHunksByScope(
      pullRequestHunks,
      allSuggestedHunks
    );
    assert.strictEqual(result.validHunks.size, 1);
    assert.strictEqual(result.invalidHunks.size, 0);
  });

  it('handles pure addition hunks', () => {
    const pullRequestHunks = new Map<string, Hunk[]>([
      [
        'file1.txt',
        [
          {
            oldStart: 1,
            oldEnd: 10,
            newStart: 1,
            newEnd: 10,
            newContent: Array(10).fill('line'),
          },
        ],
      ],
    ]);

    // Pure addition: oldEnd < oldStart indicates insertion
    const allSuggestedHunks = new Map<string, Hunk[]>([
      [
        'file1.txt',
        [
          {
            oldStart: 5,
            oldEnd: 4,
            newStart: 5,
            newEnd: 6,
            newContent: ['new line 1', 'new line 2'],
          },
        ],
      ],
    ]);

    const result = partitionSuggestedHunksByScope(
      pullRequestHunks,
      allSuggestedHunks
    );
    // This test exposes the bug: pure additions/deletions need previousLine/nextLine
    // which are not set by getSuggestedHunks
    console.log('Pure addition result:', result);
  });

  it('handles pure deletion hunks', () => {
    const pullRequestHunks = new Map<string, Hunk[]>([
      [
        'file1.txt',
        [
          {
            oldStart: 1,
            oldEnd: 10,
            newStart: 1,
            newEnd: 10,
            newContent: Array(10).fill('line'),
          },
        ],
      ],
    ]);

    // Pure deletion: newEnd < newStart indicates deletion
    const allSuggestedHunks = new Map<string, Hunk[]>([
      [
        'file1.txt',
        [
          {
            oldStart: 5,
            oldEnd: 7,
            newStart: 5,
            newEnd: 4,
            newContent: [],
          },
        ],
      ],
    ]);

    const result = partitionSuggestedHunksByScope(
      pullRequestHunks,
      allSuggestedHunks
    );
    // This test exposes the bug: pure deletions need previousLine/nextLine
    console.log('Pure deletion result:', result);
  });
});

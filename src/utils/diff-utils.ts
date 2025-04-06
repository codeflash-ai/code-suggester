// Copyright 2020 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {Hunk} from '../types';
import * as parseDiff from 'parse-diff';
import {createPatch} from 'diff';

// This header is ignored for calculating patch ranges, but is neccessary
// for parsing a diff
const _DIFF_HEADER = `diff --git a/file.ext b/file.ext
index cac8fbc..87f387c 100644
--- a/file.ext
+++ b/file.ext
`;

/**
 * Given a patch expressed in GNU diff format, return the range of lines
 * from the original content that are changed.
 * @param diff Diff expressed in GNU diff format.
 * @returns Hunk[]
 */
export function parsePatch(patch: string): Hunk[] {
  return parseAllHunks(_DIFF_HEADER + patch).get('file.ext') || [];
}

/**
 * Given a diff expressed in GNU diff format, return the range of lines
 * from the original content that are changed.
 * @param diff Diff expressed in GNU diff format.
 * @returns Map<string, Hunk[]>
 * ToDO: Need to Handle Distant Changes with some proximity threshold number
 */
export function parseAllHunks(diff: string): Map<string, Hunk[]> {
  const hunksByFile: Map<string, Hunk[]> = new Map();
  parseDiff(diff).forEach(file => {
    const filename = file.to ? file.to : file.from!;
    const hunks: Hunk[] = [];

    file.chunks.forEach(chunk => {
      // Each chunk from parseDiff already represents a logical block of changes
      // with oldStart, oldLines, newStart, newLines properties

      // Track changes within this chunk
      const addedLines: {ln: number; content: string}[] = [];
      const deletedLines: {ln: number; content: string}[] = [];
      const normalLines: {lnOld: number; lnNew: number; content: string}[] = [];

      // Process all changes in this chunk
      chunk.changes.forEach(change => {
        if (change.content.includes('No newline at end of file')) {
          return;
        }

        const content = change.content.substring(1).replace(/[\n\r]+$/g, '');

        if (change.type === 'add') {
          addedLines.push({
            ln: (change as any).ln || 0,
            content,
          });
        } else if (change.type === 'del') {
          deletedLines.push({
            ln: (change as any).ln || 0,
            content,
          });
        } else if (change.type === 'normal') {
          normalLines.push({
            lnOld: (change as any).ln1 || 0,
            lnNew: (change as any).ln2 || 0,
            content,
          });
        }
      });

      // Skip empty chunks
      if (addedLines.length === 0 && deletedLines.length === 0) {
        return;
      }

      // The chunk itself defines the range to replace in the old file
      let oldStart = chunk.oldStart;
      let oldEnd = chunk.oldStart + chunk.oldLines - 1;

      // If there are no deletions, we need to determine an insertion point
      if (deletedLines.length === 0) {
        // For pure additions, use the chunk's oldStart as the insertion point
        oldStart = oldEnd = chunk.oldStart;
      }

      // Now build the new content
      const newContent: string[] = [];

      // We'll use the new file line numbers to determine the order
      const contentByNewLine: Map<number, string> = new Map();

      // Add normal lines with their new file line numbers
      normalLines.forEach(line => {
        // Only include normal lines that are within the chunk's old file range
        if (line.lnOld >= oldStart && line.lnOld <= oldEnd) {
          contentByNewLine.set(line.lnNew, line.content);
        }
      });

      // Add added lines (these will overwrite any normal lines at the same position)
      addedLines.forEach(line => {
        contentByNewLine.set(line.ln, line.content);
      });

      // Sort by new file line number and collect the content
      const sortedLineNumbers = Array.from(contentByNewLine.keys()).sort(
        (a, b) => a - b
      );
      sortedLineNumbers.forEach(ln => {
        newContent.push(contentByNewLine.get(ln)!);
      });

      // Create the hunk using the chunk's original range and our new content
      const hunk: Hunk = {
        oldStart,
        oldEnd,
        newStart: chunk.newStart,
        newEnd: chunk.newStart + newContent.length - 1,
        newContent,
      };

      hunks.push(hunk);
    });

    if (hunks.length > 0) {
      hunksByFile.set(filename, hunks);
    }
  });

  return hunksByFile;
}

/**
 * Given two texts, return the range of lines that are changed.
 * @param oldContent The original content.
 * @param newContent The new content.
 * @returns Hunk[]
 */
export function getSuggestedHunks(
  oldContent: string,
  newContent: string
): Hunk[] {
  const diff = createPatch('unused', oldContent, newContent);
  return parseAllHunks(diff).get('unused') || [];
}

import { GetAllPatchesResponse } from "../tabs/ModifiedFilesTab";
import { DiffLine, DiffLineType, DiffMarker, FileDiff } from "./diff-types";

export const parseDiffMarker = (markerLine: string): DiffMarker => {
  // See: https://en.wikipedia.org/wiki/Diff#Unified_format
  const match = /^@@ -(\d*),?(\d*) \+(\d*),?(\d*) @@(.*)$/.exec(markerLine);

  if (match === null) throw Error(`Failed to execute regexp on marker line content: ${markerLine}`);

  return {
    deletion: {
      startLine: parseInt(match[1]),
      lineCount: match[2] === "" ? 1 : parseInt(match[2]),
    },
    addition: {
      startLine: parseInt(match[3]),
      lineCount: match[4] === "" ? 1 : parseInt(match[4]),
    },
    contextContent: match[5],
  };
};

export const parseRawDiff = (getAllPatchesResponse: GetAllPatchesResponse): FileDiff => {
  if (getAllPatchesResponse.content === null) {
    return {
      sha: getAllPatchesResponse.sha,
      status: getAllPatchesResponse.status,
      diffstat: {
        additions: getAllPatchesResponse.adds,
        deletions: getAllPatchesResponse.dels,
      },
      fileName: getAllPatchesResponse.name,
      lines: [
        {
          type: DiffLineType.Context,
          content: "This file is not viewable from HubReview",
          lineNumber: {},
        },
      ],
    };
  }

  const trimmedRawDiff = getAllPatchesResponse.content.trim();
  const rawDiffLines = trimmedRawDiff.split("\n");

  const nextLineNumbers = {
    before: -1,
    after: -1,
  };
  const diffLines: DiffLine[] = rawDiffLines.map((l): DiffLine => {
    if (l[0] === "@") {
      const diffMarker = parseDiffMarker(l);
      nextLineNumbers.before = diffMarker.deletion.startLine;
      nextLineNumbers.after = diffMarker.addition.startLine;

      return {
        type: DiffLineType.Marker,
        content: l,
        lineNumber: {},
      };
    } else if (l[0] === "+") {
      return {
        type: DiffLineType.Addition,
        content: l.slice(1),
        lineNumber: {
          before: undefined,
          after: nextLineNumbers.after++,
        },
      };
    } else if (l[0] === "-") {
      return {
        type: DiffLineType.Deletion,
        content: l.slice(1),
        lineNumber: {
          before: nextLineNumbers.before++,
          after: undefined,
        },
      };
    } else if (l[0] === " ") {
      return {
        type: DiffLineType.Context,
        content: l.slice(1),
        lineNumber: {
          before: nextLineNumbers.before++,
          after: nextLineNumbers.after++,
        },
      };
    } else if (l[0] === "\\") {
      return {
        type: DiffLineType.NoNewlineAtEOF,
        content: "No newline",
        lineNumber: {},
      };
    }
    throw Error("Unexpected line in diff");
  });

  return {
    fileName: getAllPatchesResponse.name,
    sha: getAllPatchesResponse.sha,
    status: getAllPatchesResponse.status,
    diffstat: {
      additions: getAllPatchesResponse.adds,
      deletions: getAllPatchesResponse.dels,
    },
    lines: diffLines,
  };
};

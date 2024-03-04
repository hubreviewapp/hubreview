export enum DiffLineType {
  Addition,
  Deletion,
  Context,
  Marker,
}

export type DiffMarker = {
  deletion: {
    startLine: number;
    lineCount: number;
  };
  addition: {
    startLine: number;
    lineCount: number;
  };
  contextContent: string;
};

export type DiffLine = {
  type: DiffLineType;
  content: string;
  lineNumber: {
    before?: number;
    after?: number;
  };
};

export type FileDiff = {
  fileName: string;
  diffstat: {
    additions: number;
    deletions: number;
  };
  lines: DiffLine[];
};

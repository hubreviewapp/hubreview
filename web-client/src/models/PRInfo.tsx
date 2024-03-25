export interface Label {
  id: number;
  url: string | null;
  name: string;
  nodeId: string | null;
  color: string | null;
  description: string | null;
  default: boolean;
}
export interface Check {
  id: number;
  name: string;
  status: {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    StringValue: string;
    Value: number;
  };
  conclusion: {
    StringValue: string;
    Value: number;
  };
}

export interface PRInfo {
  repoOwner: string;
  id: number;
  title: string | null;
  prNumber: number;
  author: string | null;
  authorAvatarURL: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  repoName: string | null;
  additions: number;
  deletions: number;
  files: number;
  comments: number;
  checks: Array<Check>;
  labels: Array<Label>;
}

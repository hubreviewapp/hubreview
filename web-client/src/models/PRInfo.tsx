export interface Label {
  id: number;
  url: string | null;
  name: string;
  nodeId: string | null;
  color: string | null;
  description: string | null;
  default: boolean;
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
  labels: Array<Label>;
}

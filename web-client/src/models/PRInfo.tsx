export interface PRInfo {
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
}

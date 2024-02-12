export interface PRInfo {
  id: number;
  title: string | null;
  prNumber: number;
  openedBy: string | null;
  openedByAvatarURL: string | null;
  updatedAt: string | null;
  repoName: string | null;
  additions: number;
  deletions: number;
  files: number;
  comments: number;
}

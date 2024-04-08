const makeGitHubOAuthRedirectUri = (baseUrl: string) => `${baseUrl}/api/github/acquireToken`;

export const BASE_URL = import.meta.env.PROD ? "https://api.hubreview.app" : "http://localhost:5018";
export const GITHUB_OAUTH_REDIRECT_URI = makeGitHubOAuthRedirectUri(BASE_URL);
export const GITHUB_APP_NAME = import.meta.env.VITE_GITHUB_APP_NAME ?? "hubreviewapp-dev";
export const GITHUB_APP_CLIENT_ID = import.meta.env.VITE_GITHUB_APP_CLIENT_ID ?? "Iv1.a5d1b550aaf21cac";

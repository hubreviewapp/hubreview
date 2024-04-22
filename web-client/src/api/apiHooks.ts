import { useQuery } from "@tanstack/react-query";
import { apiClient } from "./apiClient";

export const apiHooks = {
  user: Object.freeze({
    useGetCurrentQuery: () =>
      useQuery({
        queryKey: ["/users/current"],
        queryFn: apiClient.users.getCurrent,
      }),
  }),
  pullRequests: Object.freeze({
    useGetByNumberQuery: (owner: string, repoName: string, prNumber: number) =>
      useQuery({
        queryKey: [`/pullrequests/${owner}/${repoName}/${prNumber}`],
        queryFn: () => apiClient.pullRequests.getByNumber(owner, repoName, prNumber),
      }),
  }),
};

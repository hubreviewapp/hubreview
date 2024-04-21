import axios from "axios";
import { BASE_URL } from "../env";
import { APICurrentUser, APIPullRequestDetails } from "./types";

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

export const apiClient = Object.freeze({
  users: Object.freeze({
    getCurrent: () => axiosInstance.get<APICurrentUser>("/users/current"),
  }),
  pullRequests: Object.freeze({
    getByNumber: (owner: string, repoName: string, prNumber: number) =>
      axiosInstance.get<APIPullRequestDetails>(`/pullrequests/${owner}/${repoName}/${prNumber}`),
  }),
});

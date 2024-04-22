import axios, { AxiosResponse } from "axios";
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
    getByNumber: async (
      owner: string,
      repoName: string,
      prNumber: number,
    ): Promise<AxiosResponse<APIPullRequestDetails>> => {
      const response = await axiosInstance.get<APIPullRequestDetails>(`/pullrequests/${owner}/${repoName}/${prNumber}`);

      return {
        ...response,
        data: {
          ...response.data,
          updatedAt: new Date(response.data.updatedAt),
          closedAt: response.data.closedAt && new Date(response.data.closedAt),
          reviews: response.data.reviews.map((r) => ({ ...r, createdAt: new Date(r.createdAt) })),
        },
      };
    },
  }),
});

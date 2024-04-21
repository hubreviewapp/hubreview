import { ReactNode } from "react";
import UserContext from "./contexts.tsx";
import { apiHooks } from "../api/apiHooks.ts";

interface UserProviderProps {
  children: ReactNode;
}

function UserProvider({ children }: UserProviderProps) {
  const { data, isLoading: isLoadingUser } = apiHooks.user.useGetCurrentQuery();

  return <UserContext.Provider value={{ user: data?.data ?? null, isLoadingUser }}>{children}</UserContext.Provider>;
}

export default UserProvider;

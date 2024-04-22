import { ReactNode } from "react";
import UserContext from "./contexts.tsx";
import { apiHooks } from "../api/apiHooks.ts";
import { BASE_URL } from "../env.ts";
import axios from "axios";
import { useNavigate } from "react-router-dom";

interface UserProviderProps {
  children: ReactNode;
}

function UserProvider({ children }: UserProviderProps) {
  const navigate = useNavigate();

  const { data, isLoading: isLoadingUser } = apiHooks.user.useGetCurrentQuery();

  const logOut = async () => {
    localStorage.clear();
    await axios.get(`${BASE_URL}/api/github/logoutUser`, { withCredentials: true });
    navigate(0);
  };

  return (
    <UserContext.Provider value={{ user: data?.data ?? null, isLoadingUser, logOut }}>{children}</UserContext.Provider>
  );
}

export default UserProvider;

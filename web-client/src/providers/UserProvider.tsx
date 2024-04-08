import { useState, useEffect, ReactNode } from "react";
import UserContext, { User } from "./contexts.tsx"; // Assuming you have defined the User interface
import axios from "axios";
import { BASE_URL } from "../env.ts";

interface UserProviderProps {
  children: ReactNode;
}

function UserProvider({ children }: UserProviderProps) {
  const [user, setUser] = useState<User | undefined>(undefined);

  const setUserInfo = (userInfo: User) => {
    setUser({
      userLogin: userInfo.userLogin,
      userAvatarUrl: userInfo.userAvatarUrl,
    });
  };

  useEffect(() => {
    const fetchUserInfo = async () => {
      const res = await axios
        .create({
          withCredentials: true,
          baseURL: `${BASE_URL}/api/github`,
        })
        .get("getUserInfo");
      if (res) {
        setUserInfo(res.data);
      }
    };
    fetchUserInfo();
  }, []);

  if (user === undefined) {
    return null;
  }

  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

export default UserProvider;

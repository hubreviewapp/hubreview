import { createContext, useContext } from "react";

export interface User {
  userLogin: string | null;
  userAvatarUrl: string | null;
}

const UserContext = createContext<User | undefined>(undefined);
export const useUser = () => {
  const context = useContext(UserContext);

  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

export default UserContext;

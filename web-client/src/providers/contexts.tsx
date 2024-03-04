import { createContext } from "react";

export interface User {
  userLogin: string | null;
  userAvatarUrl: string | null;
}

// eslint-disable-next-line @typescript-eslint/naming-convention
const UserContext = createContext<User | undefined>(undefined);

export default UserContext;

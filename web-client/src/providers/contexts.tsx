import { createContext } from "react";
import { APICurrentUser } from "../api/types";

export interface IUserContext {
  user: APICurrentUser | null;
  isLoadingUser: boolean;
}

// eslint-disable-next-line @typescript-eslint/naming-convention
const UserContext = createContext<IUserContext>({ user: null, isLoadingUser: true });

export default UserContext;

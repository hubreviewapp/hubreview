import React, { useState, useEffect, ReactNode } from 'react';
import UserContext, { User } from './contexts.tsx'; // Assuming you have defined the User interface
import axios from 'axios';

interface UserProviderProps {
  children: ReactNode;
}

const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | undefined>(undefined);

  const setUserInfo = (userInfo: User) => {
    setUser({
      userLogin: userInfo.userLogin,
      userAvatarUrl: userInfo.userAvatarUrl,
    });
  };

  useEffect(() => {
    const fetchUserInfo = async () => {
      const res = await axios.create({
        withCredentials: true,
        baseURL: "http://localhost:5018/api/github"
      }).get("getUserInfo");
      if (res) {
        setUserInfo(res.data);
      }
    };
    fetchUserInfo();
  }, []);


  if (user === undefined) {
    return null;
  }

  return (
    <UserContext.Provider value={user}>
      {children}
    </UserContext.Provider>
  );
};

export default UserProvider;

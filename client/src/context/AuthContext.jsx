import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api.js';

export const AuthContext = createContext();

const AUTH_USER_KEY = 'user';

const getStoredUser = () => {
  const fromSession = sessionStorage.getItem(AUTH_USER_KEY);
  if (fromSession) return fromSession;
  return localStorage.getItem(AUTH_USER_KEY);
};

const setStoredUser = (value) => {
  sessionStorage.setItem(AUTH_USER_KEY, value);
  localStorage.setItem(AUTH_USER_KEY, value);
};

const clearStoredUser = () => {
  sessionStorage.removeItem(AUTH_USER_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const syncUser = async () => {
      const storedUser = getStoredUser();
      if (!storedUser) return;

      // Keep tab-local auth isolated even if another tab logs in as a different canteen.
      if (!sessionStorage.getItem(AUTH_USER_KEY)) {
        sessionStorage.setItem(AUTH_USER_KEY, storedUser);
      }

      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);

        if (parsedUser?.token) {
          const { data } = await api.get('/auth/profile');
          const refreshedUser = {
            ...parsedUser,
            ...data,
            token: parsedUser.token,
          };
          setUser(refreshedUser);
          setStoredUser(JSON.stringify(refreshedUser));
        }
      } catch {
        setUser(null);
        clearStoredUser();
      }
    };

    syncUser();
  }, []);

  const login = (userData) => {
    setUser(userData);
    setStoredUser(JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    clearStoredUser();
  };

  const updateUser = async (userData) => {
    login(userData); // Update local context and storage with new token
  };

  const deleteUser = () => {
    logout(); // Clear local context and storage
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, deleteUser }}>
      {children}
    </AuthContext.Provider>
  );
};

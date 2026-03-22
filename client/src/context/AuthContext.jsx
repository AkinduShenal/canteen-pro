import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api.js';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const syncUser = async () => {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) return;

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
          localStorage.setItem('user', JSON.stringify(refreshedUser));
        }
      } catch {
        setUser(null);
        localStorage.removeItem('user');
      }
    };

    syncUser();
  }, []);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
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

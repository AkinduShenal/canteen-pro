import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
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

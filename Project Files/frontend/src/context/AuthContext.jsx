import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, signOut } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Retrieve JWT token for authenticated backend API requests
  const getIdToken = async () => {
    if (auth.currentUser) {
      try {
        return await auth.currentUser.getIdToken(true);
      } catch (err) {
        console.error("Error retrieving Firebase ID token:", err);
        return null;
      }
    }
    return null;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const logout = () => {
    return signOut(auth);
  };

  const value = {
    currentUser,
    getIdToken,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

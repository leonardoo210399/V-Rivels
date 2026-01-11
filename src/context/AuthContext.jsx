"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { account } from "@/lib/appwrite";
import { OAuthProvider } from "appwrite";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUserStatus();
  }, []);

  async function checkUserStatus() {
    try {
      const accountDetails = await account.get();
      setUser(accountDetails);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  const isAdmin = user?.labels?.includes("admin");

  
  async function loginWithGoogle() {
      try {
        account.createOAuth2Session(
          OAuthProvider.Google,
          `${window.location.origin}/profile`,
          `${window.location.origin}/login`
        );
      } catch (error) {
        console.error(error);
      }
    }

  async function logout() {
    await account.deleteSession("current");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loginWithGoogle, logout, loading, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

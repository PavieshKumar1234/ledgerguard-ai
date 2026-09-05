"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

import {
  login as apiLogin,
  getCurrentUser,
} from "@/lib/api";

type User = {
  sub?: string;
  email: string;
  role: string;
  name?: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;

  signIn: (
    email: string,
    password: string,
    remember?: boolean
  ) => Promise<boolean>;

  signOut: () => void;

  updateDisplayName: (name: string) => void;
};

const AuthContext =
  createContext<AuthContextType | undefined>(
    undefined
  );

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] =
    useState<User | null>(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    async function restoreSession() {
      const token =
        localStorage.getItem(
          "ledgerguard_token"
        );

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const result =
          await getCurrentUser();

        if (result?.authenticated) {
          const backendUser =
            result.user;

          const savedName =
            localStorage.getItem(
              "ledgerguard_display_name"
            );

          setUser({
            ...backendUser,
            name:
              savedName ||
              backendUser.name ||
              "Arjun Kapoor",
          });
        } else {
          localStorage.removeItem(
            "ledgerguard_token"
          );
        }
      } catch {
        localStorage.removeItem(
          "ledgerguard_token"
        );

        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    restoreSession();
  }, []);

  async function signIn(
    email: string,
    password: string,
    remember = true
  ): Promise<boolean> {
    try {
      const result =
        await apiLogin(
          email,
          password
        );

      if (!result?.access_token) {
        return false;
      }

      localStorage.setItem(
        "ledgerguard_token",
        result.access_token
      );

      if (remember) {
        localStorage.setItem(
          "ledgerguard_authenticated",
          "true"
        );
      }

      const currentUser =
        await getCurrentUser();

      if (
        currentUser?.authenticated
      ) {
        const backendUser =
          currentUser.user;

        const savedName =
          localStorage.getItem(
            "ledgerguard_display_name"
          );

        setUser({
          ...backendUser,
          name:
            savedName ||
            backendUser.name ||
            "Arjun Kapoor",
        });
      }

      return true;
    } catch (error) {
      console.error(
        "Login failed:",
        error
      );

      return false;
    }
  }

  function updateDisplayName(
    name: string
  ) {
    const cleanName =
      name.trim();

    if (!cleanName) {
      return;
    }

    localStorage.setItem(
      "ledgerguard_display_name",
      cleanName
    );

    setUser((currentUser) => {
      if (!currentUser) {
        return currentUser;
      }

      return {
        ...currentUser,
        name: cleanName,
      };
    });
  }

  function signOut() {
    localStorage.removeItem(
      "ledgerguard_token"
    );

    localStorage.removeItem(
      "ledgerguard_authenticated"
    );

    setUser(null);

    window.location.href =
      "/login";
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signOut,
        updateDisplayName,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}

export function AuthGuard({
  children,
}: {
  children: ReactNode;
}) {
  const {
    user,
    loading,
  } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-sm text-blue-400 font-mono">
          AUTHENTICATING...
        </div>
      </div>
    );
  }

  if (!user) {
    if (
      typeof window !==
      "undefined"
    ) {
      window.location.href =
        "/login";
    }

    return null;
  }

  return <>{children}</>;
}
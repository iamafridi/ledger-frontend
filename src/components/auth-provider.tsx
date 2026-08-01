"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";

import { firebaseAuth, firebaseConfigError, isAuthConfigured } from "@/lib/firebase";

interface AuthValue {
  user: User | null;
  /** False until Firebase has reported the restored session, so a signed-in
   *  user never sees a flash of the signed-out state on reload. */
  ready: boolean;
  configError: string | null;
  signIn(email: string, password: string): Promise<void>;
  register(email: string, password: string): Promise<void>;
  signInWithGoogle(): Promise<void>;
  signOut(): Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function useAuth(): AuthValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const configError = firebaseConfigError();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(!isAuthConfigured);

  useEffect(() => {
    if (!isAuthConfigured) return;
    return onAuthStateChanged(firebaseAuth(), (next) => {
      setUser(next);
      setReady(true);
    });
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      user,
      ready,
      configError,
      signIn: async (email, password) => {
        await signInWithEmailAndPassword(firebaseAuth(), email, password);
      },
      register: async (email, password) => {
        await createUserWithEmailAndPassword(firebaseAuth(), email, password);
      },
      signInWithGoogle: async () => {
        const provider = new GoogleAuthProvider();
        // Always show the chooser. Without this, a browser signed into one
        // Google account signs straight back into it after "sign out", which
        // looks like the sign-out button is broken.
        provider.setCustomParameters({ prompt: "select_account" });
        await signInWithPopup(firebaseAuth(), provider);
      },
      signOut: async () => {
        await firebaseSignOut(firebaseAuth());
        setUser(null);
      },
    }),
    [user, ready, configError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

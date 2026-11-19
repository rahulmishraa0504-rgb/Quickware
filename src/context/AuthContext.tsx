import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import {
  auth,
  db,
  signInWithGoogle,
  signOutUser,
  BOOTSTRAPPED_ADMIN_EMAIL,
} from '../firebase';
import { FirestoreService } from '../services/firestoreService';
import { UserProfile } from '../types';

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  authReady: boolean;
  authLoading: boolean;
  authError: string | null;
  loginWithGoogle: () => Promise<User | null>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const syncUserState = async (firebaseUser: User | null) => {
    if (!firebaseUser) {
      setUser(null);
      setProfile(null);
      setIsAdmin(false);
      setAuthReady(true);
      return;
    }

    setUser(firebaseUser);
    try {
      const userProfile = await FirestoreService.ensureUserProfile(firebaseUser);
      setProfile(userProfile);

      let adminFlag =
        firebaseUser.emailVerified &&
        firebaseUser.email === BOOTSTRAPPED_ADMIN_EMAIL;

      if (!adminFlag && firebaseUser.emailVerified) {
        try {
          const adminSnap = await getDoc(doc(db, 'admins', firebaseUser.uid));
          if (adminSnap.exists()) {
            adminFlag = true;
          }
        } catch {
          // Not an admin
        }
      }

      setIsAdmin(adminFlag);

      if (adminFlag) {
        await FirestoreService.seedInitialCatalogueIfEmpty();
      }
    } catch (err) {
      console.error('Error syncing user profile:', err);
    } finally {
      setAuthReady(true);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      syncUserState(firebaseUser);
    });
    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async (): Promise<User | null> => {
    setAuthError(null);
    setAuthLoading(true);
    try {
      const result = await signInWithGoogle();
      return result.user;
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/popup-closed-by-user') {
        setAuthError('Sign-in popup was closed before completing.');
      } else if (code === 'auth/popup-blocked') {
        setAuthError('Browser blocked the Google sign-in popup. Please allow popups and try again.');
      } else {
        setAuthError(err?.message || 'Google sign-in failed. Please try again.');
      }
      return null;
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = async () => {
    setAuthLoading(true);
    try {
      await signOutUser();
    } finally {
      setAuthLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const updated = await FirestoreService.ensureUserProfile(user);
      setProfile(updated);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAdmin,
        authReady,
        authLoading,
        authError,
        loginWithGoogle,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};

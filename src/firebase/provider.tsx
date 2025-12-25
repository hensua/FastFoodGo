'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, doc, onSnapshot } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import type { AppUser } from '@/lib/types';
import { getSdks } from '.';

// Combined state for the user's authentication and profile data.
interface UserState {
  user: User | null;
  userDoc: AppUser | null;
  isLoading: boolean; // This will be true until both auth and userDoc are resolved.
  error: Error | null;
}

// The complete state provided by the Firebase context.
export interface FirebaseContextState {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  user: User | null;
  userDoc: AppUser | null;
  isLoading: boolean;
  error: Error | null;
}

// The return type of the primary useUser() hook.
export interface UserHookResult extends UserState {}

// React Context
export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

// --- FirebaseProvider ---
interface FirebaseProviderProps {
  children: ReactNode;
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
}

export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
  firebaseApp,
  firestore,
  auth,
}) => {
  const [userState, setUserState] = useState<UserState>({
    user: null,
    userDoc: null,
    isLoading: true, // Start in a loading state.
    error: null,
  });

  // Effect to handle Firebase Auth state changes.
  useEffect(() => {
    // Set initial loading state.
    setUserState(prev => ({ ...prev, isLoading: true }));

    const unsubscribeAuth = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        if (!firebaseUser) {
          // If no user is logged in, we are done loading.
          setUserState({ user: null, userDoc: null, isLoading: false, error: null });
        } else {
          // If a user is logged in, update the auth user but keep loading until we get their doc.
          setUserState(prev => ({ ...prev, user: firebaseUser, isLoading: true }));
        }
      },
      (error) => {
        console.error("FirebaseProvider: Auth error:", error);
        setUserState({ user: null, userDoc: null, isLoading: false, error });
      }
    );

    return () => unsubscribeAuth();
  }, [auth]);

  // Effect to fetch the user's Firestore document when their auth state changes.
  useEffect(() => {
    // Don't do anything if there's no logged-in user.
    if (!userState.user) {
      return;
    }

    const userDocRef = doc(firestore, 'users', userState.user.uid);

    const unsubscribeDoc = onSnapshot(
      userDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          // User document found, update state and finish loading.
          setUserState(prev => ({ ...prev, userDoc: docSnap.data() as AppUser, isLoading: false, error: null }));
        } else {
          // User is authenticated but has no document. This could be a new user.
          // For now, we consider loading finished without a userDoc.
          setUserState(prev => ({ ...prev, userDoc: null, isLoading: false, error: null }));
        }
      },
      (error) => {
        console.error("FirebaseProvider: User document fetch error:", error);
        setUserState(prev => ({ ...prev, userDoc: null, isLoading: false, error }));
      }
    );

    return () => unsubscribeDoc();
  }, [userState.user, firestore]); // This effect depends on the authenticated user.

  // Memoize the complete context value.
  const contextValue = useMemo((): FirebaseContextState => ({
    firebaseApp,
    firestore,
    auth,
    user: userState.user,
    userDoc: userState.userDoc,
    isLoading: userState.isLoading,
    error: userState.error,
  }), [firebaseApp, firestore, auth, userState]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};

// --- Hooks ---

/**
 * Hook to access the entire Firebase context state.
 * Throws an error if used outside a FirebaseProvider.
 */
export const useFirebase = (): FirebaseContextState => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider.');
  }
  return context;
};

/** Hook to access the Firebase Auth instance. */
export const useAuth = (): Auth => {
  const { auth } = useFirebase();
  return auth;
};

/** Hook to access the Firestore instance. */
export const useFirestore = (): Firestore => {
  const { firestore } = useFirebase();
  return firestore;
};

/** Hook to access the Firebase App instance. */
export const useFirebaseApp = (): FirebaseApp => {
  const { firebaseApp } = useFirebase();
  return firebaseApp;
};

/** Hook to access the combined user authentication and profile state. */
export const useUser = (): UserHookResult => {
  const { user, userDoc, isLoading, error } = useFirebase();
  return { user, userDoc, isLoading, error };
};

/**
 * A hook to memoize Firebase queries or references to prevent re-renders.
 * It's essential for hooks like `useCollection` and `useDoc`.
 */
type MemoFirebase<T> = T & { __memo?: boolean };

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T {
  const memoized = useMemo(factory, deps);
  
  if (memoized && typeof memoized === 'object') {
    (memoized as MemoFirebase<T>).__memo = true;
  }
  
  return memoized as T;
}

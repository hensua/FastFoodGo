'use client';
import {
  Auth, // Import Auth type for type hinting
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  // Assume getAuth and app are initialized elsewhere
} from 'firebase/auth';

/** Initiate anonymous sign-in (non-blocking). */
export function initiateAnonymousSignIn(authInstance: Auth): void {
  // CRITICAL: Call signInAnonymously directly. Do NOT use 'await signInAnonymously(...)'.
  signInAnonymously(authInstance);
  // Code continues immediately. Auth state change is handled by onAuthStateChanged listener.
}

/** Initiate email/password sign-up (non-blocking). */
export function initiateEmailSignUp(authInstance: Auth, email: string, password: string): void {
  // CRITICAL: Call createUserWithEmailAndPassword directly. Do NOT use 'await createUserWithEmailAndPassword(...)'.
  createUserWithEmailAndPassword(authInstance, email, password);
  // Code continues immediately. Auth state change is handled by onAuthStateChanged listener.
}

/** 
 * Initiate email/password sign-in (non-blocking).
 * If the user does not exist, it creates a new user.
 */
export async function initiateEmailSignIn(authInstance: Auth, email: string, password: string): Promise<void> {
  try {
    await signInWithEmailAndPassword(authInstance, email, password);
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      // If user doesn't exist, create them.
      await createUserWithEmailAndPassword(authInstance, email, password);
    } else {
      // Re-throw other errors (e.g., wrong password) to be handled by the caller.
      throw error;
    }
  }
}


/** Initiate Google sign-in (non-blocking). */
export function initiateGoogleSignIn(authInstance: Auth): Promise<void> {
  const provider = new GoogleAuthProvider();
  // We return the promise to allow the caller to handle cancellations.
  return signInWithPopup(authInstance, provider).then(() => {}).catch(error => {
    // Re-throw the error to be caught by the caller, unless it's a cancellation.
    if (error.code !== 'auth/cancelled-popup-request' && error.code !== 'auth/popup-closed-by-user') {
      throw error;
    }
  });
}

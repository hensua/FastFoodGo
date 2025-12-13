"use server";

import { doc, getDoc, setDoc, deleteDoc, getFirestore } from "firebase/firestore";
import { getAuth } from "firebase-admin/auth";
import { initializeApp, getApps, cert } from "firebase-admin/app";

// Initialize Firebase Admin SDK if not already initialized
if (!getApps().length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string);
  initializeApp({
    credential: cert(serviceAccount)
  });
}

const adminAuth = getAuth();
const adminFirestore = getFirestore();

export async function listAllUsers() {
  try {
    const userRecords = await adminAuth.listUsers();
    const users = userRecords.users.map((user) => ({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
    }));
    return { success: true, users };
  } catch (error: any) {
    console.error("Error listing users:", error);
    return { success: false, error: error.message };
  }
}

export async function getUserRoles(uid: string) {
  const adminRoleRef = doc(adminFirestore, "roles_admin", uid);
  const driverRoleRef = doc(adminFirestore, "roles_driver", uid);

  const [isAdminDoc, isDriverDoc] = await Promise.all([
    getDoc(adminRoleRef),
    getDoc(driverRoleRef),
  ]);

  return {
    isAdmin: isAdminDoc.exists(),
    isDriver: isDriverDoc.exists(),
  };
}

export async function setUserRole(uid: string, role: 'admin' | 'driver' | 'customer') {
  const adminRoleRef = doc(adminFirestore, "roles_admin", uid);
  const driverRoleRef = doc(adminFirestore, "roles_driver", uid);

  try {
    // Start by removing any existing role
    await deleteDoc(adminRoleRef);
    await deleteDoc(driverRoleRef);

    // Set the new role
    if (role === 'admin') {
      await setDoc(adminRoleRef, { assignedAt: new Date() });
    } else if (role === 'driver') {
      await setDoc(driverRoleRef, { assignedAt: new Date() });
    }
    // 'customer' role is the default (absence of other roles), so no doc is needed.

    return { success: true };
  } catch (error: any) {
    console.error("Error setting user role:", error);
    return { success: false, error: error.message };
  }
}
    
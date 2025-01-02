"use client";

import { useEffect, useState } from 'react';
import { app, auth, GoogleAuthProvider, signInWithPopup, firestore, doc, getDoc } from '../lib/firebaseConfig';
import { useRouter } from 'next/navigation';
import { getAuth } from 'firebase/auth';

export default function Home() {
  const router = useRouter();

  const handleGoogleSignIn = async () => {
    // const auth = getAuth(app);
    // const provider = new GoogleAuthProvider();
    try {
      // const result = await signInWithPopup(auth, provider);
      // const user = result.user;
      // const userRef = doc(firestore, 'users', user.uid);
      // const userDoc = await getDoc(userRef);
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Error signing in with Google:', error.message);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      // setUser(user)  
      if (user) {
        router.push('/dashboard');
      }
    });
    return () => unsubscribe();
  }, [router]);

  return (
    <div className="flex justify-center items-center h-screen bg-slate-900">
      <button
        onClick={handleGoogleSignIn}
        className="bg-blue-500 text-white px-16 py-6 text-2xl rounded-lg"
      >
        Sign in with Google
      </button>
    </div>
  );
}

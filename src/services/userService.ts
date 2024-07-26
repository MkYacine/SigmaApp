// src/services/userService.ts

import { db } from './firebase';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { User } from '../types';

export const createUser = async (user: User): Promise<void> => {
    try {
        await setDoc(doc(db, 'users', user.id), user);
        console.log('User document created successfully');
      } catch (error) {
        console.error('Error creating user document:', error);
        throw error; // Re-throw the error so it can be caught in the signup function
      }
};

export const getUser = async (userId: string): Promise<User | null> => {
  const docRef = doc(db, 'users', userId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return docSnap.data() as User;
  } else {
    return null;
  }
};

export const updateUser = async (userId: string, updates: Partial<User>): Promise<void> => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, updates);
};
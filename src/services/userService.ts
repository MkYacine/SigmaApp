// src/services/userService.ts

import { db } from './firebase';
import { doc, setDoc, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { User } from '../types';

let userCache: { [key: string]: User } = {};

export const initializeUserCache = async (): Promise<void> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'users'));
    querySnapshot.forEach((doc) => {
      userCache[doc.id] = doc.data() as User;
    });
    console.log('User cache initialized with', Object.keys(userCache).length, 'users');
  } catch (error) {
    console.error('Error initializing user cache:', error);
  }
};

export const createUser = async (user: User): Promise<void> => {
  try {
    await setDoc(doc(db, 'users', user.id), user);
    userCache[user.id] = user;
    console.log('User document created successfully');
  } catch (error) {
    console.error('Error creating user document:', error);
    throw error;
  }
};

export const getUser = async (userId: string): Promise<User | null> => {
  if (userCache[userId]) {
    return userCache[userId];
  }

  const docRef = doc(db, 'users', userId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    const userData = docSnap.data() as User;
    userCache[userId] = userData;
    return userData;
  } else {
    return null;
  }
};

export const updateUser = async (userId: string, updates: Partial<User>): Promise<void> => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, updates);
  if (userCache[userId]) {
    userCache[userId] = { ...userCache[userId], ...updates };
  }
};

export const getUserFullName = (userId: string): string => {
  const user = userCache[userId];
  return user ? `${user.firstName} ${user.lastName}` : 'Unknown User';
};

export const clearUserCache = (): void => {
  userCache = {};
};

export const getUserCache = (): { [key: string]: User } => {
  return userCache;
};
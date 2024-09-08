import React, { createContext, useState, useContext, useEffect } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '../services/firebase';
import { getUser } from '../services/userService';
import { User } from '../types';
import { Timestamp } from 'firebase/firestore';

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  user: User | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({ firebaseUser: null, user: null, isLoading: true });

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser);
      if (firebaseUser) {
        try {
          const userData = await getUser(firebaseUser.uid);
          if (userData) {
            // Convert Timestamp fields to Date objects
            const convertedUser = {
              ...userData,
              birthDate: userData.birthDate instanceof Timestamp ? userData.birthDate.toDate() : new Date(userData.birthDate),
              createdAt: userData.createdAt instanceof Timestamp ? userData.createdAt.toDate() : new Date(userData.createdAt),
              lastLoginAt: userData.lastLoginAt instanceof Timestamp ? userData.lastLoginAt.toDate() : new Date(userData.lastLoginAt),
            };
            setUser(convertedUser);
          } else {
            console.error('User data not found in Firestore');
            setUser(null);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ firebaseUser, user, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
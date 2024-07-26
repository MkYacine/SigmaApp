// src/types.ts

export type UserStatus = 'Actif' | 'Actif Special' | 'Alumnus' | 'Pledge';
export type ExecRole = 'None' | 'Administrative' | 'Operational' | 'General';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  birthDate: Date;
  pledgingSession: string;
  aka: string;
  status: UserStatus;
  exec: ExecRole;
  createdAt: Date;
  lastLoginAt: Date;
}

export interface SignupFormValues extends Omit<User, 'id' | 'createdAt' | 'lastLoginAt'> {
    password: string;
  }
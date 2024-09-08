// src/types.ts

import { Timestamp } from "firebase/firestore";

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

export enum Channel {
  General = 'general',
  Admin = 'admin',
  Rush = 'rush'
}

export interface BaseItem {
  id: string;
  authorId: string;
  title: string;
  description: string;
  channelId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Announcement extends BaseItem {
  type: 'announcement';
}

export interface Event extends BaseItem {
  type: 'event';
  startDate: Timestamp;
  endDate: Timestamp;
  location?: string;
  requiredMembers?: number;
  assignedMembers?: string[];
}

export interface Task extends BaseItem {
  type: 'task';
  deadline: Timestamp;
  assignedMembers?: string[];
  status: 'pending' | 'in-progress' | 'completed';
}

export type FeedItem = Announcement | Event | Task;

export interface UserPermissions {
  canCreateAnnouncements: boolean;
  canCreateEvents: boolean;
  canCreateTasks: boolean;
  allowedChannels: string[]; // Channel IDs
}
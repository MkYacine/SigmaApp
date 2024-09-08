// src/services/feedService.ts

import { db } from './firebase';
import { collection, doc, getDocs, query, where, orderBy, limit, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Channel, Announcement, Event, Task, FeedItem } from '../types';
import { Timestamp } from 'firebase/firestore';

// const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds


// Channel Services
export const createChannel = async (channel: Omit<Channel, 'id'>): Promise<string> => {
  const docRef = await addDoc(collection(db, 'channels'), channel);
  return docRef.id;
};

export const getChannels = async (): Promise<Channel[]> => {
  const querySnapshot = await getDocs(collection(db, 'channels'));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Channel));
};

// Generic create function for Announcements, Events, and Tasks
const createItem = async <T extends Omit<FeedItem, 'id'>>(
  collectionName: 'announcements' | 'events' | 'tasks',
  item: T
): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, collectionName), item);
    console.log(`Successfully created ${collectionName} with ID: ${docRef.id}`);
    clearFeedItemsCache(); // Clear cache to ensure new item appears in feed
    return docRef.id;
  } catch (error) {
    console.error(`Error creating ${collectionName}:`, error);
    throw error;
  }
};

export const createAnnouncement = async (announcement: Omit<Announcement, 'id'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'announcements'), announcement);
    console.log(`Successfully created announcement with ID: ${docRef.id}`);
    clearFeedItemsCache(); // Clear cache to ensure new item appears in feed
    return docRef.id;
  } catch (error) {
    console.error('Error creating announcement:', error);
    throw error;
  }
};

export const createEvent = (event: Omit<Event, 'id'>) => 
  createItem('events', event);

export const createTask = (task: Omit<Task, 'id'>) => 
  createItem('tasks', task);


export const getFeedItems = async (
  channelIds: Channel[],
  itemType?: 'announcement' | 'event' | 'task',
  pageSize: number = 20,
  forceRefresh: boolean = false
): Promise<FeedItem[]> => {
  if (cachedFeedItems && !forceRefresh) {
    console.log('Returning cached feed items');
    return cachedFeedItems;
  }

  console.log('Fetching feed items');
  
  const collections = itemType ? [itemType + 's'] : ['announcements', 'events', 'tasks'];
  const queries = collections.map(collectionName => 
    query(
      collection(db, collectionName),
      where('channelId', 'in', channelIds),
      orderBy('createdAt', 'desc'),
      limit(pageSize)
    )
  );

  const querySnapshots = await Promise.all(queries.map(q => getDocs(q)));
  const allDocs = querySnapshots.flatMap(snapshot => snapshot.docs);

  console.log('Total documents fetched:', allDocs.length);

  // Sort all documents by createdAt
  allDocs.sort((a, b) => b.data().createdAt.toMillis() - a.data().createdAt.toMillis());

  // Slice to get only pageSize number of items
  const feedItems = allDocs.slice(0, pageSize).map(doc => {
    const data = doc.data();
    const baseItem = {
      id: doc.id,
      ...data,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
      type: doc.ref.parent.id.slice(0, -1) as 'announcement' | 'event' | 'task',
    };

    switch (baseItem.type) {
      case 'announcement':
        return baseItem as Announcement;
      case 'event':
        return {
          ...baseItem,
          startDate: data.startDate.toDate(),
          endDate: data.endDate.toDate(),
        } as Event;
      case 'task':
        return {
          ...baseItem,
          deadline: data.deadline.toDate(),
        } as Task;
    }
  });

  console.log('Processed feed items:', feedItems);

  cachedFeedItems = feedItems;
  return feedItems;
};

// Function to get events for calendar
export const getEvents = async (startDate: Date, endDate: Date, forceRefresh: boolean = false): Promise<Event[]> => {
  const cacheKey = `${startDate.toISOString()}-${endDate.toISOString()}`;
  
  if (!forceRefresh && cachedEvents[cacheKey]) {
    console.log('Returning cached events');
    return cachedEvents[cacheKey];
  }

  console.log('Fetching events');

  const q = query(
    collection(db, 'events'),
    where('startDate', '>=', startDate),
    where('startDate', '<=', endDate),
    orderBy('startDate')
  );

  const querySnapshot = await getDocs(q);
  const events = querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      startDate: (data.startDate as Timestamp).toDate(),
      endDate: (data.endDate as Timestamp).toDate(),
      createdAt: (data.createdAt as Timestamp).toDate(),
      updatedAt: (data.updatedAt as Timestamp).toDate(),
    } as Event;
  });

  cachedEvents[cacheKey] = events;
  return events;
};

// Function to get tasks for a user
export const getTasks = async (userId: string, status?: Task['status']): Promise<Task[]> => {
  let q = query(
    collection(db, 'tasks'),
    where('assignedMembers', 'array-contains', userId),
    orderBy('deadline')
  );

  if (status) {
    q = query(q, where('status', '==', status));
  }

  const querySnapshot = await getDocs(q);
  const tasks = querySnapshot.docs.map(doc => {
    const data = doc.data();
    console.log('Task data:', data);
    return {
      id: doc.id,
      ...data,
      deadline: data.deadline?.toDate() || null,
      createdAt: data.createdAt?.toDate() || null,
      updatedAt: data.updatedAt?.toDate() || null,
    } as Task;
  });
  console.log('Processed tasks:', tasks);
  return tasks;
};

// Function to update an item (Announcement, Event, or Task)
export const updateItem = async <T extends FeedItem>(
    collectionName: 'announcements' | 'events' | 'tasks',
    itemId: string,
    updates: Partial<T>
  ): Promise<void> => {
    const docRef = doc(db, collectionName, itemId);
    await updateDoc(docRef, updates as { [x: string]: any });
  };
  
// Function to delete an item (Announcement, Event, or Task)
export const deleteItem = async (
  collectionName: 'announcements' | 'events' | 'tasks',
  itemId: string
): Promise<void> => {
  await deleteDoc(doc(db, collectionName, itemId));
};

// Add this at the top of the file
let cachedFeedItems: FeedItem[] | null = null;
let cachedEvents: { [key: string]: Event[] } = {};


// Add this function to clear the cache
export const clearFeedItemsCache = () => {
  cachedFeedItems = null;
};

export const clearEventsCache = () => {
  cachedEvents = {};
};
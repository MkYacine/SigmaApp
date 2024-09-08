import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { getTasks } from '../services/feedService';
import { Task } from '../types';
import { colors, typography, commonStyles } from '../styles';
import { format, isValid } from 'date-fns';

const ProfileScreen: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const fetchedTasks = await getTasks(user.id);
      console.log('Fetched tasks:', fetchedTasks);
      setTasks(fetchedTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setError('Failed to load tasks. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTasks();
    setRefreshing(false);
  }, [fetchTasks]);

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>User not found</Text>
      </View>
    );
  }

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const formatDate = (date: Date | string | number | { seconds: number; nanoseconds: number }) => {
    if (date instanceof Date) {
      return format(date, 'MMMM d, yyyy');
    } else if (typeof date === 'object' && 'seconds' in date) {
      return format(new Date(date.seconds * 1000), 'MMMM d, yyyy');
    } else if (isValid(new Date(date))) {
      return format(new Date(date), 'MMMM d, yyyy');
    }
    return 'Invalid Date';
  };

  console.log('User:', user);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
          />
        }
      >
        <View style={styles.container}>
          <Text style={styles.screenTitle}>Profile</Text>
          <View style={styles.userInfoContainer}>
            <Text style={styles.userName}>{user.firstName} {user.lastName}</Text>
            <Text style={styles.userDetail}>AKA: {user.aka}</Text>
            <Text style={styles.userDetail}>Status: {user.status}</Text>
            <Text style={styles.userDetail}>Exec Role: {user.exec}</Text>
            <Text style={styles.userDetail}>Pledging Session: {user.pledgingSession}</Text>
            <Text style={styles.userDetail}>Birth Date: {formatDate(user.birthDate)}</Text>
          </View>

          <View style={styles.taskDashboard}>
            <Text style={styles.dashboardTitle}>Task Dashboard</Text>
            {error && <Text style={styles.errorText}>{error}</Text>}
            {tasks.length === 0 ? (
              <Text style={styles.noTasksText}>No assigned tasks</Text>
            ) : (
              tasks.map(task => (
                <View key={task.id} style={styles.taskItem}>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  <Text style={styles.taskDeadline}>
                    Deadline: {formatDate(task.deadline)}
                  </Text>
                  <Text style={styles.taskStatus}>Status: {task.status}</Text>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  container: {
    ...commonStyles.container,
    paddingHorizontal: 16,
  },
  screenTitle: {
    ...typography.largeTitle,
    marginBottom: 16,
    marginTop: 8,
  },
  userInfoContainer: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  userName: {
    ...typography.title,
    marginBottom: 8,
  },
  userDetail: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  taskDashboard: {
    marginTop: 24,
  },
  dashboardTitle: {
    ...typography.subtitle,
    marginBottom: 16,
  },
  taskItem: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  taskTitle: {
    ...typography.body,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  taskDeadline: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  taskStatus: {
    ...typography.caption,
    color: colors.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    ...typography.body,
    color: colors.error,
    textAlign: 'center',
    marginBottom: 16,
  },
  noTasksText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default ProfileScreen;

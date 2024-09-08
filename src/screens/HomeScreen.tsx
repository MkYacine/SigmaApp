//HomeScreen.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, SafeAreaView, TouchableOpacity, RefreshControl } from 'react-native';
import { getFeedItems, clearFeedItemsCache, deleteItem } from '../services/feedService';
import { FeedItem, Announcement, Event, Task } from '../types';
import { colors, typography, commonStyles } from '../styles';
import { formatDistanceToNow, format } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Alert } from 'react-native';
import { getUserFullName } from '../services/userService';
import { Channel } from '../types';
import { Picker } from '@react-native-picker/picker';

const HomeScreen: React.FC = () => {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedChannels, setSelectedChannels] = useState<Channel[]>([Channel.General]);
  const navigation = useNavigation();

  const loadFeedItems = useCallback(async (forceRefresh: boolean = false) => {
    setLoading(true);
    try {
      const items = await getFeedItems(Object.values(Channel), undefined, 20, forceRefresh);
      setFeedItems(items.filter(item => selectedChannels.includes(item.channelId as Channel)));
    } catch (error) {
      console.error('Error fetching feed items:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedChannels]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => loadFeedItems());
    loadFeedItems(); // Initial load
    return unsubscribe;
  }, [navigation, loadFeedItems]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    clearFeedItemsCache(); // Clear the cache before refreshing
    await loadFeedItems(true);
    setRefreshing(false);
  }, [loadFeedItems]);

  const handleDeleteItem = useCallback(async (item: FeedItem) => {
    Alert.alert(
      "Delete Item",
      "Are you sure you want to delete this item?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              await deleteItem(item.type + 's', item.id);
              clearFeedItemsCache();
              await loadFeedItems(true);
            } catch (error) {
              console.error('Error deleting item:', error);
              Alert.alert("Error", "Failed to delete the item. Please try again.");
            }
          }
        }
      ]
    );
  }, [loadFeedItems]);

  const renderDeleteButton = (item: FeedItem) => (
    <TouchableOpacity
      style={styles.deleteButton}
      onPress={() => handleDeleteItem(item)}
    >
      <Ionicons name="trash-outline" size={20} color={colors.error} />
    </TouchableOpacity>
  );

  const renderAnnouncementItem = (item: Announcement) => (
    <View style={styles.feedItem}>
      <View style={styles.feedItemHeader}>
        <Text style={styles.feedItemTitle}>{item.title}</Text>
        <Text style={styles.feedItemChannel}>{item.channelId}</Text>
      </View>
      <Text style={styles.feedItemDescription}>{item.description}</Text>
      <View style={styles.feedItemFooter}>
        <Text style={styles.feedItemAuthor}>{getUserFullName(item.authorId)}</Text>
        <Text style={styles.feedItemDate}>
          {formatDistanceToNow(item.createdAt, { addSuffix: true })}
        </Text>
      </View>
    </View>
  );

  const renderEventItem = (item: Event) => (
    <View style={styles.feedItem}>
      <View style={styles.feedItemHeader}>
        <Text style={styles.feedItemTitle}>{item.title}</Text>
        <Text style={styles.feedItemChannel}>{item.channelId}</Text>
      </View>
      <Text style={styles.feedItemDescription}>{item.description}</Text>
      <Text style={styles.feedItemEventDate}>
        {format(item.startDate, "MMM d, yyyy 'at' h:mm a")}
      </Text>
      {item.location && <Text style={styles.feedItemLocation}>{item.location}</Text>}
      <View style={styles.feedItemFooter}>
        <Text style={styles.feedItemAuthor}>{getUserFullName(item.authorId)}</Text>
        <Text style={styles.feedItemDate}>
          {formatDistanceToNow(item.createdAt, { addSuffix: true })}
        </Text>
      </View>
    </View>
  );

  const renderTaskItem = (item: Task) => (
    <View style={styles.feedItem}>
      <View style={styles.feedItemHeader}>
        <Text style={styles.feedItemTitle}>{item.title}</Text>
        <Text style={styles.feedItemChannel}>{item.channelId}</Text>
      </View>
      <Text style={styles.feedItemDescription}>{item.description}</Text>
      {item.deadline && (
        <Text style={styles.feedItemDeadline}>
          Deadline: {format(item.deadline, "MMM d, yyyy 'at' h:mm a")}
        </Text>
      )}
      <Text style={styles.feedItemStatus}>Status: {item.status}</Text>
      <View style={styles.feedItemFooter}>
        <Text style={styles.feedItemAuthor}>{getUserFullName(item.authorId)}</Text>
        <Text style={styles.feedItemDate}>
          {formatDistanceToNow(item.createdAt, { addSuffix: true })}
        </Text>
      </View>
    </View>
  );

  const renderFeedItem = ({ item }: { item: FeedItem }) => {
    const itemContent = (() => {
      switch (item.type) {
        case 'announcement':
          return renderAnnouncementItem(item);
        case 'event':
          return renderEventItem(item);
        case 'task':
          return renderTaskItem(item);
        default:
          return null;
      }
    })();

    return (
      <View style={styles.feedItemContainer}>
        {itemContent}
        {renderDeleteButton(item)}
      </View>
    );
  };

  const renderChannelSelector = () => (
    <View style={styles.channelSelector}>
      <Text style={styles.channelSelectorLabel}>Select Channels:</Text>
      {Object.values(Channel).map((channel) => (
        <TouchableOpacity
          key={channel}
          style={[
            styles.channelButton,
            selectedChannels.includes(channel) && styles.selectedChannelButton
          ]}
          onPress={() => {
            setSelectedChannels(prev => 
              prev.includes(channel)
                ? prev.filter(c => c !== channel)
                : [...prev, channel]
            );
          }}
        >
          <Text style={[
            styles.channelButtonText,
            selectedChannels.includes(channel) && styles.selectedChannelButtonText
          ]}>
            {channel}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={commonStyles.centeredContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.screenTitle}>Feed</Text>
        {renderChannelSelector()}
        <FlatList
          data={feedItems}
          renderItem={renderFeedItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
            />
          }
        />
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('CreateFeedItem')}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
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
  listContainer: {
    paddingBottom: 16,
  },
  feedItem: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  feedItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  feedItemTitle: {
    ...typography.subtitle,
    flex: 1,
  },
  feedItemChannel: {
    ...typography.caption,
    color: colors.primary,
    backgroundColor: colors.backgroundTertiary,
    paddingHorizontal: 5,
    paddingVertical: 4,
    borderRadius: 4,
    overflow: 'hidden',
    right: 18,
    bottom: 8
  },
  feedItemDescription: {
    ...typography.body,
    marginBottom: 12,
  },
  feedItemEventDate: {
    ...typography.body,
    color: colors.primary,
    marginBottom: 8,
  },
  feedItemLocation: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  feedItemDeadline: {
    ...typography.body,
    color: colors.primary,
    marginBottom: 8,
  },
  feedItemStatus: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  feedItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feedItemAuthor: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  feedItemDate: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: colors.primary,
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  feedItemContainer: {
    position: 'relative',
  },
  deleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 1,
  },
  channelSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    alignItems: 'center',
  },
  channelSelectorLabel: {
    ...typography.body,
    marginRight: 8,
  },
  channelButton: {
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedChannelButton: {
    backgroundColor: colors.primary,
  },
  channelButtonText: {
    ...typography.body,
    color: colors.text,
  },
  selectedChannelButtonText: {
    color: colors.buttonText,
  },
});

export default HomeScreen;
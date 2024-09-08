import React, { useState, useEffect } from 'react';
import { Platform, View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, FlatList, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, commonStyles } from '../styles';
import { createAnnouncement, createEvent, createTask } from '../services/feedService';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Timestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { getUserCache } from '../services/userService';
import { User, Channel } from '../types';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

const CreateFeedItemScreen: React.FC = () => {
  const [itemType, setItemType] = useState<'announcement' | 'event' | 'task'>('announcement');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [channelId, setChannelId] = useState<Channel>(Channel.General);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [location, setLocation] = useState('');
  const [deadline, setDeadline] = useState(new Date());
  const [status, setStatus] = useState<'pending' | 'in-progress' | 'completed'>('pending');
  const [requiredMembers, setRequiredMembers] = useState<number>(0);
  const [assignedMembers, setAssignedMembers] = useState<string[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const navigation = useNavigation();
  const { user } = useAuth();

  useEffect(() => {
    const userCache = getUserCache();
    setUsers(Object.values(userCache));
  }, []);

  const toggleMemberSelection = (userId: string) => {
    setAssignedMembers(prevMembers => 
      prevMembers.includes(userId)
        ? prevMembers.filter(id => id !== userId)
        : [...prevMembers, userId]
    );
  };

  const renderMemberItem = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={[
        styles.memberItem,
        assignedMembers.includes(item.id) && styles.selectedMemberItem
      ]}
      onPress={() => toggleMemberSelection(item.id)}
    >
      <Text style={[
        styles.memberItemText,
        assignedMembers.includes(item.id) && styles.selectedMemberItemText
      ]}>
        {`${item.firstName} ${item.lastName}`}
      </Text>
    </TouchableOpacity>
  );

  const renderChannelItem = ({ item }: { item: Channel }) => (
    <TouchableOpacity
      style={[
        styles.channelItem,
        channelId === item && styles.selectedChannelItem
      ]}
      onPress={() => setChannelId(item)}
    >
      <Text style={[
        styles.channelItemText,
        channelId === item && styles.selectedChannelItemText
      ]}>
        {item}
      </Text>
    </TouchableOpacity>
  );

  const registerForPushNotificationsAsync = async () => {
    let token;
    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        alert('Failed to get push token for push notification!');
        return;
      }
      try {
        token = (await Notifications.getExpoPushTokenAsync({
          projectId: Constants.expoConfig?.extra?.eas?.projectId,
        })).data;
      } catch (error) {
        console.error('Error getting push token:', error);
        alert('Error getting push token. Push notifications may not work.');
      }
    } else {
      alert('Must use physical device for Push Notifications');
    }

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return token;
  };

  const handleCreate = async () => {
    if (!user) {
      console.error('No user logged in');
      return;
    }

    const token = await registerForPushNotificationsAsync();
    if (token && user) {
      await setDoc(doc(db, 'users', user.id), { expoPushToken: token }, { merge: true });
    }

    const baseItem = {
      title,
      description,
      channelId,
      authorId: user.id,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    try {
      let newItemId: string;
      switch (itemType) {
        case 'announcement':
          newItemId = await createAnnouncement({
            ...baseItem,
            type: 'announcement' as const,
          });
          break;
        case 'event':
          newItemId = await createEvent({
            ...baseItem,
            type: 'event' as const,
            startDate: Timestamp.fromDate(startDate),
            endDate: Timestamp.fromDate(endDate),
            location,
            requiredMembers,
            assignedMembers,
          });
          break;
        case 'task':
          newItemId = await createTask({
            ...baseItem,
            type: 'task' as const,
            deadline: Timestamp.fromDate(deadline),
            status,
            assignedMembers,
          });
          break;
        default:
          throw new Error(`Invalid item type: ${itemType}`);
      }
      console.log(`New ${itemType} created with ID: ${newItemId}`);
      navigation.goBack();
    } catch (error) {
      console.error(`Error creating ${itemType}:`, error);
      // You might want to show an error message to the user here
      Alert.alert('Error', `Failed to create ${itemType}. Please try again.`);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Create New Feed Item</Text>
        <View style={styles.typeSelector}>
          {['Announcement', 'Event', 'Task'].map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.typeButton, itemType === type.toLowerCase() && styles.selectedType]}
              onPress={() => setItemType(type.toLowerCase() as 'announcement' | 'event' | 'task')}
            >
              <Text style={[styles.typeButtonText, itemType === type.toLowerCase() && styles.selectedTypeText]}>{type}</Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <ScrollView style={styles.scrollContent}>
          <TextInput
            style={styles.input}
            placeholder="Title"
            placeholderTextColor={colors.textSecondary}
            value={title}
            onChangeText={setTitle}
          />
          <TextInput
            style={[styles.input, styles.multilineInput]}
            placeholder="Description"
            placeholderTextColor={colors.textSecondary}
            value={description}
            onChangeText={setDescription}
            multiline
          />
          <Text style={styles.sectionTitle}>Select Channel</Text>
          <FlatList
            data={Object.values(Channel)}
            renderItem={renderChannelItem}
            keyExtractor={(item) => item}
            horizontal={true}
            style={styles.channelList}
          />
          {itemType === 'event' && (
            <>
              <View style={styles.dateContainer}>
                <Text style={styles.label}>Start Date</Text>
                <DateTimePicker
                  value={startDate}
                  mode="datetime"
                  display="default"
                  onChange={(event, selectedDate) => setStartDate(selectedDate || startDate)}
                  textColor={colors.text}
                  style={styles.datePicker}
                />
              </View>
              <View style={styles.dateContainer}>
                <Text style={styles.label}>End Date</Text>
                <DateTimePicker
                  value={endDate}
                  mode="datetime"
                  display="default"
                  onChange={(event, selectedDate) => setEndDate(selectedDate || endDate)}
                  textColor={colors.text}
                  style={styles.datePicker}
                />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Location"
                placeholderTextColor={colors.textSecondary}
                value={location}
                onChangeText={setLocation}
              />
              <TextInput
                style={styles.input}
                placeholder="Required Members"
                placeholderTextColor={colors.textSecondary}
                value={requiredMembers.toString()}
                onChangeText={(value) => setRequiredMembers(parseInt(value) || 0)}
                keyboardType="numeric"
              />
            </>
          )}
          {itemType === 'task' && (
            <>
              <View style={styles.dateContainer}>
                <Text style={styles.label}>Deadline</Text>
                <DateTimePicker
                  value={deadline}
                  mode="datetime"
                  display="default"
                  onChange={(event, selectedDate) => setDeadline(selectedDate || deadline)}
                  textColor={colors.text}
                  style={styles.datePicker}
                />
              </View>
              <View style={styles.statusSelector}>
                {['Pending', 'In-Progress', 'Completed'].map((statusOption) => (
                  <TouchableOpacity
                    key={statusOption}
                    style={[styles.statusButton, status === statusOption.toLowerCase() && styles.selectedStatus]}
                    onPress={() => setStatus(statusOption.toLowerCase() as 'pending' | 'in-progress' | 'completed')}
                  >
                    <Text style={[styles.statusButtonText, status === statusOption.toLowerCase() && styles.selectedStatusText]}>{statusOption}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </ScrollView>

        {(itemType === 'event' || itemType === 'task') && (
          <>
            <Text style={styles.sectionTitle}>Assign Members</Text>
            <FlatList
              data={users}
              renderItem={renderMemberItem}
              keyExtractor={(item) => item.id}
              horizontal={false}
              numColumns={2}
              style={styles.memberList}
            />
          </>
        )}
        <TouchableOpacity style={styles.createButton} onPress={handleCreate}>
          <Text style={styles.createButtonText}>Create</Text>
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
    padding: 16,
  },
  title: {
    ...typography.largeTitle,
    marginBottom: 16,
  },
  typeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  typeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: colors.backgroundSecondary,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  selectedType: {
    backgroundColor: colors.primary,
  },
  typeButtonText: {
    ...typography.body,
    color: colors.text,
  },
  selectedTypeText: {
    color: colors.buttonText,
    fontWeight: 'bold',
  },
  input: {
    ...commonStyles.input,
    marginBottom: 16,
  },
  multilineInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  label: {
    ...typography.body,
    marginRight: 16,
    flex: 1,
  },
  statusSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statusButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: colors.backgroundSecondary,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  selectedStatus: {
    backgroundColor: colors.primary,
  },
  statusButtonText: {
    ...typography.body,
    color: colors.text,
  },
  selectedStatusText: {
    color: colors.buttonText,
    fontWeight: 'bold',
  },
  createButton: {
    ...commonStyles.button,
    marginTop: 16,
  },
  createButtonText: {
    ...commonStyles.buttonText,
  },
  sectionTitle: {
    ...typography.subtitle,
    marginTop: 16,
    marginBottom: 8,
  },
  memberList: {
    marginBottom: 16,
  },
  memberItem: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: colors.backgroundSecondary,
    margin: 4,
    alignItems: 'center',
  },
  selectedMemberItem: {
    backgroundColor: colors.primary,
  },
  memberItemText: {
    ...typography.body,
    color: colors.text,
  },
  selectedMemberItemText: {
    color: colors.buttonText,
    fontWeight: 'bold',
  },
  channelList: {
    marginBottom: 16,
  },
  channelItem: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: colors.backgroundSecondary,
    marginRight: 8,
  },
  selectedChannelItem: {
    backgroundColor: colors.primary,
  },
  channelItemText: {
    ...typography.body,
    color: colors.text,
  },
  selectedChannelItemText: {
    color: colors.buttonText,
    fontWeight: 'bold',
  },
});

export default CreateFeedItemScreen;
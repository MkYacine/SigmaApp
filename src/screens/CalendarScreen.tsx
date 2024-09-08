import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, ScrollView, RefreshControl } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { getEvents, clearEventsCache } from '../services/feedService';
import { Event } from '../types';
import { colors, typography, commonStyles } from '../styles';
import { startOfMonth, endOfMonth, format, isValid, parseISO, isSameMonth } from 'date-fns';

const CalendarScreen: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const fetchEvents = useCallback(async (date: Date, forceRefresh: boolean = false) => {
    setLoading(true);
    setError(null);
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    try {
      const fetchedEvents = await getEvents(start, end, forceRefresh);
      setEvents(fetchedEvents.filter(event => isValid(event.startDate) && isValid(event.endDate)));
    } catch (error) {
      console.error('Error fetching events:', error);
      setError('Failed to load events. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents(currentMonth);
  }, [fetchEvents, currentMonth]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    clearEventsCache();
    await fetchEvents(currentMonth, true);
    setRefreshing(false);
  }, [fetchEvents, currentMonth]);

  const markedDates = events.reduce((acc, event) => {
    const dateString = format(event.startDate, 'yyyy-MM-dd');
    acc[dateString] = { marked: true, dotColor: colors.primary };
    return acc;
  }, {} as { [key: string]: { marked: boolean; dotColor: string } });

  const onMonthChange = (monthData: DateData) => {
    const newMonth = new Date(monthData.timestamp);
    setCurrentMonth(newMonth);
    fetchEvents(newMonth);
  };

  const sortedEvents = events
    .filter(event => isSameMonth(event.startDate, currentMonth))
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        <View style={styles.container}>
          <Text style={styles.screenTitle}>Calendar</Text>
          <Calendar
            onDayPress={() => {}} // We're not using day selection anymore
            markedDates={markedDates}
            onMonthChange={onMonthChange}
            theme={{
              calendarBackground: colors.backgroundSecondary,
              textSectionTitleColor: colors.text,
              dayTextColor: colors.text,
              todayTextColor: colors.primary,
              selectedDayBackgroundColor: colors.primary,
              selectedDayTextColor: colors.buttonText,
              monthTextColor: colors.text,
              arrowColor: colors.primary,
            }}
          />
          {loading && !refreshing && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          )}
          {error && <Text style={styles.errorText}>{error}</Text>}
          <View style={styles.eventsContainer}>
            <Text style={styles.selectedDateText}>
              Events for {format(currentMonth, 'MMMM yyyy')}:
            </Text>
            {sortedEvents.length === 0 ? (
              <Text style={styles.noEventsText}>No events for this month</Text>
            ) : (
              sortedEvents.map(event => (
                <View key={event.id} style={styles.eventItem}>
                  <Text style={styles.eventDate}>
                    {format(event.startDate, 'MMMM d, yyyy')}
                  </Text>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <Text style={styles.eventTime}>
                    {format(event.startDate, 'h:mm a')} - {format(event.endDate, 'h:mm a')}
                  </Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  eventsContainer: {
    marginTop: 20,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 8,
    padding: 16,
  },
  selectedDateText: {
    ...typography.title,
    color: colors.text,
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary,
  },
  eventItem: {
    backgroundColor: colors.backgroundTertiary,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  eventDate: {
    ...typography.caption,
    color: colors.primary,
    marginBottom: 4,
  },
  eventTitle: {
    ...typography.body,
    fontWeight: 'bold',
  },
  eventTime: {
    ...typography.caption,
    marginTop: 4,
  },
  errorText: {
    ...typography.body,
    color: colors.primary,
    textAlign: 'center',
    marginTop: 16,
  },
  noEventsText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default CalendarScreen;
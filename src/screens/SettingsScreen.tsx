import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { typography, commonStyles } from '../styles';

const SettingsScreen: React.FC = () => {
  const { user } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      // The AuthContext will automatically update the user state
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      {user && (
        <Text style={styles.userInfo}>
          Logged in as: {user.firstName}-{user.lastName}-{user.id}
        </Text>
      )}
      <TouchableOpacity style={styles.button} onPress={handleSignOut}>
        <Text style={styles.buttonText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...commonStyles.container,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...typography.largeTitle,
    marginBottom: 24,
  },
  userInfo: {
    ...typography.body,
    marginBottom: 24,
  },
  button: {
    ...commonStyles.button,
    width: '100%',
    maxWidth: 200,
  },
  buttonText: {
    ...commonStyles.buttonText,
  },
});

export default SettingsScreen;

// src/screens/ForgotPasswordScreen.tsx

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../services/firebase';
import { colors, typography, commonStyles } from '../styles';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../navigation/AuthNavigator';

type ForgotPasswordScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'ForgotPassword'>;

type ForgotPasswordScreenProps = {
  navigation: ForgotPasswordScreenNavigationProp;
};

const validationSchema = Yup.object().shape({
  email: Yup.string().email('Invalid email').required('Email is required'),
});

const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ navigation }) => {
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async (values: { email: string }) => {
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, values.email);
      Alert.alert('Success', 'Password reset email sent. Please check your inbox.');
      navigation.navigate('Login');
    } catch (error) {
      Alert.alert('Error', 'Failed to send password reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reset Password</Text>
      <Formik
        initialValues={{ email: '' }}
        validationSchema={validationSchema}
        onSubmit={handleResetPassword}
      >
        {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
          <>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={colors.textSecondary}
              onChangeText={handleChange('email')}
              onBlur={handleBlur('email')}
              value={values.email}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {touched.email && errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            
            <TouchableOpacity 
              style={styles.button} 
              onPress={() => handleSubmit()} 
              disabled={loading}
            >
              <Text style={styles.buttonText}>{loading ? 'Sending...' : 'Reset Password'}</Text>
            </TouchableOpacity>
          </>
        )}
      </Formik>
      
      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>Back to Login</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...commonStyles.container,
    justifyContent: 'center',
  },
  title: {
    ...typography.largeTitle,
    marginBottom: 24,
  },
  input: {
    ...commonStyles.input,
  },
  button: {
    ...commonStyles.button,
    marginTop: 16,
  },
  buttonText: {
    ...commonStyles.buttonText,
  },
  link: {
    ...commonStyles.linkText,
    marginTop: 16,
  },
  errorText: {
    color: colors.primary,
    fontSize: 14,
    marginBottom: 8,
  },
});

export default ForgotPasswordScreen;
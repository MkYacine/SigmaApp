// src/screens/SignupScreen.tsx
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';
import { createUser } from '../services/userService';
import { colors, typography, commonStyles } from '../styles';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../navigation/AuthNavigator';
import { User, UserStatus, ExecRole, SignupFormValues } from '../types';
import DateTimePicker from '@react-native-community/datetimepicker';

type SignupScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Signup'>;

type SignupScreenProps = {
  navigation: SignupScreenNavigationProp;
};

const validationSchema = Yup.object().shape({
  email: Yup.string().email('Invalid email').required('Email is required'),
  password: Yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
  firstName: Yup.string().required('First name is required'),
  lastName: Yup.string().required('Last name is required'),
  birthDate: Yup.date().required('Birth date is required'),
  pledgingSession: Yup.string().required('Pledging session is required'),
  aka: Yup.string(),
  status: Yup.string().oneOf(['Actif', 'Actif Special', 'Alumnus', 'Pledge']).required('Status is required'),
  exec: Yup.string().oneOf(['None', 'Administrative', 'Operational', 'General']).required('Exec role is required'),
});

const SignupScreen: React.FC<SignupScreenProps> = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleSignup = async (values: SignupFormValues) => {
    setLoading(true);
    try {
      const { password, ...userWithoutPassword } = values;
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, password);
      const user: User = {
        ...userWithoutPassword,
        id: userCredential.user.uid,
        createdAt: new Date(),
        lastLoginAt: new Date(),
      };
      await createUser(user);
      Alert.alert('Success', 'Account created successfully');
      navigation.navigate('Login');
    } catch (error) {
      console.error('Signup error:', error);
      Alert.alert('Error', `Failed to create account: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollViewContent}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          <View style={styles.innerContainer}>
            <Text style={styles.title}>Sign Up</Text>
            <Formik
              initialValues={{
                email: '',
                password: '',
                firstName: '',
                lastName: '',
                birthDate: new Date(),
                pledgingSession: '',
                aka: '',
                status: 'Pledge' as UserStatus,
                exec: 'None' as ExecRole,
              }}
              validationSchema={validationSchema}
              onSubmit={handleSignup}
            >
              {({ handleChange, handleBlur, handleSubmit, setFieldValue, values, errors, touched }) => (
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
                  
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor={colors.textSecondary}
                    onChangeText={handleChange('password')}
                    onBlur={handleBlur('password')}
                    value={values.password}
                    secureTextEntry
                  />
                  {touched.password && errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
                  
                  <TextInput
                    style={styles.input}
                    placeholder="First Name"
                    placeholderTextColor={colors.textSecondary}
                    onChangeText={handleChange('firstName')}
                    onBlur={handleBlur('firstName')}
                    value={values.firstName}
                  />
                  {touched.firstName && errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}
                  
                  <TextInput
                    style={styles.input}
                    placeholder="Last Name"
                    placeholderTextColor={colors.textSecondary}
                    onChangeText={handleChange('lastName')}
                    onBlur={handleBlur('lastName')}
                    value={values.lastName}
                  />
                  {touched.lastName && errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}
                  
                  <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.input}>
                    <Text style={styles.dateText}>{values.birthDate.toDateString()}</Text>
                  </TouchableOpacity>
                  {showDatePicker && (
                    <DateTimePicker
                      value={values.birthDate}
                      mode="date"
                      display="default"
                      onChange={(event, selectedDate) => {
                        setShowDatePicker(false);
                        if (selectedDate) {
                          setFieldValue('birthDate', selectedDate);
                        }
                      }}
                    />
                  )}
                  {touched.birthDate && errors.birthDate && <Text style={styles.errorText}>{errors.birthDate as string}</Text>}
                  
                  <TextInput
                    style={styles.input}
                    placeholder="Pledging Session (e.g., F23)"
                    placeholderTextColor={colors.textSecondary}
                    onChangeText={handleChange('pledgingSession')}
                    onBlur={handleBlur('pledgingSession')}
                    value={values.pledgingSession}
                  />
                  {touched.pledgingSession && errors.pledgingSession && <Text style={styles.errorText}>{errors.pledgingSession}</Text>}
                  
                  <TextInput
                    style={styles.input}
                    placeholder="AKA (Nickname)"
                    placeholderTextColor={colors.textSecondary}
                    onChangeText={handleChange('aka')}
                    onBlur={handleBlur('aka')}
                    value={values.aka}
                  />
                  
                  {/* TODO: Add dropdowns for status and exec role here */}
                  <TextInput
                    style={styles.input}
                    placeholder="Status"
                    placeholderTextColor={colors.textSecondary}
                    onChangeText={handleChange('status')}
                    onBlur={handleBlur('status')}
                    value={values.status}
                  />
                  {touched.status && errors.status && <Text style={styles.errorText}>{errors.status}</Text>}
                  
                  <TextInput
                    style={styles.input}
                    placeholder="Exec Role"
                    placeholderTextColor={colors.textSecondary}
                    onChangeText={handleChange('exec')}
                    onBlur={handleBlur('exec')}
                    value={values.exec}
                  />
                  {touched.exec && errors.exec && <Text style={styles.errorText}>{errors.exec}</Text>}
                  
                  <TouchableOpacity 
                    style={styles.button} 
                    onPress={() => handleSubmit()} 
                    disabled={loading}
                  >
                    <Text style={styles.buttonText}>{loading ? 'Creating Account...' : 'Sign Up'}</Text>
                  </TouchableOpacity>
                </>
              )}
            </Formik>
            
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.link}>Already have an account? Log in</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  innerContainer: {
    padding: 20,
    justifyContent: 'center',
    minHeight: '100%',
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
  dateText: {
    color: colors.text,
  },
});

export default SignupScreen;
import { StyleSheet } from 'react-native';
import { TextStyle } from 'react-native';

// Color palette
export const colors = {
  primary: '#C70F0A',
  background: '#161616',
  backgroundSecondary: '#282828',
  inputBackground: '#393939',
  text: 'white',
  textSecondary: '#B2B2B2',
  buttonText: 'white',
};

// Typography
export const typography = {
largeTitle: {
    fontSize: 28,
    fontWeight: '700' as TextStyle['fontWeight'],
    color: colors.text,
    } as TextStyle,
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  body: {
    fontSize: 16,
    color: colors.text,
  },
  caption: {
    fontSize: 14,
    color: colors.textSecondary,
  },
};

// Common styles
export const commonStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: colors.inputBackground,
    borderRadius: 24,
    paddingHorizontal: 16,
    marginBottom: 16,
    color: colors.text,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: colors.buttonText,
    fontSize: 16,
    fontWeight: 'bold',
  },
  linkText: {
    color: colors.primary,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});

// Screen-specific styles
export const authStyles = StyleSheet.create({
  logo: {
    width: 120,
    height: 120,
    marginBottom: 32,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 16,
  },
});

export const homeStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryContainer: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
});

export const profileStyles = StyleSheet.create({
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  infoContainer: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
});

// You can add more screen-specific styles as needed

export default {
  colors,
  typography,
  commonStyles,
  authStyles,
  homeStyles,
  profileStyles,
};
# SigmaApp

SigmaApp is a comprehensive mobile application designed to streamline organization management and enhance member communication. Built with React Native and Expo, this app provides a robust platform for organization members to stay connected, organized, and engaged. This app serves as a personal introduction to mobile app development.

## Features

- User Authentication: Secure login and signup functionality
- Feed Management: Create and view announcements, events, and tasks
- Real-time Updates: Utilizes Firebase for instant data synchronization
- Push Notifications: Event reminders and important updates
- User Profiles: Manage personal information and roles within the fraternity
- Channel-based Communication: Organize content by specific channels or groups

## Technology Stack

- React Native
- Expo
- Firebase (Authentication, Firestore, Cloud Functions)
- TypeScript
- React Navigation
- Formik & Yup for form management and validation

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up your Firebase project and add the configuration to `.env` file
4. Run the app: `expo start`

## Project Structure

- `src/screens`: Contains all the main screens of the application
- `src/services`: Houses Firebase and other service-related functions
- `src/contexts`: Includes context providers, such as AuthContext
- `src/navigation`: Defines the navigation structure of the app
- `src/styles`: Global styles and theme definitions
- `functions`: Firebase Cloud Functions for backend logic

## License

This project is licensed under the MIT License.
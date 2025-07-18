import React, { useEffect, useState, useRef } from 'react';
import { Alert, BackHandler, View, Text, StyleSheet, Platform, AppState, AppStateStatus } from 'react-native';
import * as ScreenCapture from 'expo-screen-capture';
import NetInfo from '@react-native-community/netinfo';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import PrivacySnapshot from 'react-native-privacy-snapshot';

// Screens
import SplashScreen from './screens/SplashScreen';
import LoginScreen from './screens/LoginScreen';
import WelcomeScreen from './screens/WelcomeScreen';
import DashboardScreen from './screens/DashboardScreen';
import InstructionsScreen from './screens/InstructionsScreen';
import InstructionReviewScreen from './screens/InstructionReviewScreen';
import ApprovalFlowTimeline from './screens/ApprovalFlowTimeline';

import {
  TouchableWithoutFeedback,
} from 'react-native';

// Context
import { AuthProvider } from './context/AuthContext';
import { UserInfo } from './types/auth.types';

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Welcome: { userInfo?: UserInfo };
  Dashboard: undefined;
  Instructions: undefined;
  InstructionReviewScreen: {
    instruction: string;
    statusId: string;
  };
  ApprovalFlowTimeline: {
    instructionData: string;
    onClose: string;
  };
};

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList | null>(null);
  const idleTimeout = 190000; // 20 minutes
  const warningTimeout = 120000; // 1 minute
  const [isActive, setIsActive] = useState(true);
  const [warningShown, setWarningShown] = useState(false);
  const appState = useRef(AppState.currentState);
  const warningTimer = useRef<NodeJS.Timeout | null>(null);
  const logoutTimer = useRef<NodeJS.Timeout | null>(null);
  const isLoggingOut = useRef(false);

  useEffect(() => {
    setInitialRoute('Splash');

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, []);

  const handleAppStateChange = async (nextAppState: AppStateStatus) => {
    if (appState.current === 'active' && nextAppState.match(/inactive|background/)) {
      await handleLogout('App moved to background.');
    }
    appState.current = nextAppState;
  };

  const handleLogout = async (reason: string) => {
    if (isLoggingOut.current) return;
    isLoggingOut.current = true;

    clearTimers();
    setWarningShown(false);

    Alert.alert('Session Expired', reason);

    // You'll need to implement your logout logic here
    // For example, clear tokens, reset navigation, etc.
    // navigationRef.current?.reset({
    //   index: 0,
    //   routes: [{ name: 'Login' }],
    // });

    isLoggingOut.current = false;
  };

  const clearTimers = () => {
    if (warningTimer.current) clearTimeout(warningTimer.current);
    if (logoutTimer.current) clearTimeout(logoutTimer.current);
    warningTimer.current = null;
    logoutTimer.current = null;
  };

  const startInactivityTimers = () => {
    clearTimers();
    setWarningShown(false);

    warningTimer.current = setTimeout(() => {
      if (!warningShown) {
        Alert.alert(
          'Inactivity Warning',
          'You will be logged out soon due to inactivity.',
          [{ text: 'Stay Logged In', onPress: () => setIsActive(true) }]
        );
        setWarningShown(true);
      }
    }, warningTimeout);

    logoutTimer.current = setTimeout(() => {
      handleLogout('You have been logged out due to inactivity.');
    }, idleTimeout);
  };

  useEffect(() => {
    if (isActive) startInactivityTimers();
    return () => clearTimers();
  }, [isActive]);

  const handleUserInteraction = () => {
    if (!isLoggingOut.current) {
      setIsActive(true);
    }
  };

  if (!initialRoute) return null;

  return (
    <TouchableWithoutFeedback onPress={handleUserInteraction}>
      <View style={{ flex: 1 }}>
        <NavigationContainer>
          <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Dashboard" component={DashboardScreen} />
            <Stack.Screen name="Instructions" component={InstructionsScreen} />
            <Stack.Screen name="InstructionReviewScreen" component={InstructionReviewScreen} />
            <Stack.Screen name="ApprovalFlowTimeline" component={ApprovalFlowTimeline} />
          </Stack.Navigator>
        </NavigationContainer>
      </View>
    </TouchableWithoutFeedback>
  );
};

const App: React.FC = () => {
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    // 🚫 Prevent screen capture (screenshots + screen recording)
    (async () => {
      try {
        await ScreenCapture.preventScreenCaptureAsync();
      } catch (err) {
        console.warn('Screen capture prevention error:', err);
      }
    })();

    // 🔒 Enable blur in iOS app switcher
    if (Platform.OS === 'ios') {
      PrivacySnapshot.enabled(true);
    }

    // 📡 Enforce mobile data usage only
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.type === 'wifi' && state.isConnected) {
        setIsBlocked(true);
        Alert.alert(
          'Mobile Data Required',
          'This app only works with mobile data. Please disable Wi-Fi.',
          [
            {
              text: 'Exit',
              onPress: () => BackHandler.exitApp(),
              style: 'destructive',
            }
          ],
          { cancelable: false }
        );
      } else {
        setIsBlocked(false);
      }
    });

    return () => {
      unsubscribe();
      if (Platform.OS === 'ios') {
        PrivacySnapshot.enabled(false);
      }
    };
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        {isBlocked ? (
          <View style={styles.blockedOverlay}>
            <Text style={styles.blockedText}>
              Wi-Fi detected. Please switch to mobile data.
            </Text>
          </View>
        ) : (
          <AppNavigator />
        )}
      </AuthProvider>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  blockedOverlay: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  blockedText: {
    fontSize: 18,
    textAlign: 'center',
    color: 'red',
  },
});

export default App;
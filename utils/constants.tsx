import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  AppState,
  AppStateStatus,
  View,
  TouchableWithoutFeedback,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Provider as PaperProvider } from 'react-native-paper';

import SplashScreen from './src/components/SplashScreen';
import LoginScreen from './src/screens/LoginScreen';
import OTPValidation from './src/screens/OTPValidation';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import PasswordRetypePassword from './src/screens/PasswordRetypePassword';
import PortfolioScreen from './src/screens/PortfolioScreen';
import SummaryScreen from './src/screens/SummaryScreen';
import StatementScreen from './src/SummaryTabs/StatementScreen';
import InstructionScreen from './src/SummaryTabs/InstructionScreen';
import DrawInstructionScreen from './src/SummaryTabs/DrawInstructionScreen';
import LimitRangeScreen from './src/SummaryTabs/LimitRangeScreen';
import ApprovalFlowScreen from './src/shared/WithdrawTimelineScreen';
import InstructionReviewScreen from './src/SummaryTabs/InstructionReviewScreen';
import ApprovalTimelineScreen from './src/screens/ApprovalTimelineScreen';
import ApprovalFlowTimeline from './src/SummaryTabs/ApprovalFlowTimeline';
import BeneficiaryMakerScreen from './src/components/BeneficiaryMakerScreen';
import BeneficiarySignatoryScreen from './src/components/BeneficiarySignatoryScreen';
import CustomDrawer from './src/components/CustomDrawer';

import { navigationRef } from './src/api/api';

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

let currentRouteName = null;
export const getCurrentRouteName = () => currentRouteName;

function MainDrawer() {
  return (
    <Drawer.Navigator
      initialRouteName="Portfolio"
      drawerContent={(props) => <CustomDrawer {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: 'slide',
        overlayColor: 'transparent',
        drawerStyle: { width: '80%' },
      }}
    >
      <Drawer.Screen name="Portfolio" component={PortfolioScreen} />
      <Drawer.Screen name="SummaryScreen" component={SummaryScreen} />
      <Drawer.Screen name="StatementScreen" component={StatementScreen} />
      <Drawer.Screen name="InstructionScreen" component={InstructionScreen} />
      <Drawer.Screen name="DrawInstructionScreen" component={DrawInstructionScreen} />
      <Drawer.Screen name="LimitRangeScreen" component={LimitRangeScreen} />
      <Drawer.Screen name="WithdrawTimelineScreen" component={ApprovalFlowScreen} />
      <Drawer.Screen name="InstructionReviewScreen" component={InstructionReviewScreen} />
      <Drawer.Screen name="ApprovalFlowTimeline" component={ApprovalFlowTimeline} />
      <Drawer.Screen name="BeneficiaryScreen" component={BeneficiaryMakerScreen} />
      <Drawer.Screen name="BeneficiarySignatoryScreen" component={BeneficiarySignatoryScreen} />
    </Drawer.Navigator>
  );
}

export default function App() {
  const idleTimeout = 120000; // 1 minute
  const warningTimeout = 50000; // 50 seconds
  const [isActive, setIsActive] = useState(true);
  const [warningShown, setWarningShown] = useState(false);
  const appState = useRef(AppState.currentState);
  const warningTimer = useRef<NodeJS.Timeout | null>(null);
  const logoutTimer = useRef<NodeJS.Timeout | null>(null);
  const isLoggingOut = useRef(false);

  useEffect(() => {
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

    navigationRef.current?.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });

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

  return (
    <PaperProvider>
      <TouchableWithoutFeedback onPress={handleUserInteraction}>
        <View style={{ flex: 1 }}>
          <NavigationContainer
            ref={navigationRef}
            onReady={() => {
              const name = navigationRef.current?.getCurrentRoute()?.name;
              currentRouteName = name ?? null;
            }}
            onStateChange={() => {
              const name = navigationRef.current?.getCurrentRoute()?.name;
              currentRouteName = name ?? null;
            }}
          >
            <Stack.Navigator
              initialRouteName="Splash"
              screenOptions={{
                headerShown: false,
                animation: 'fade',
                gestureEnabled: false,
              }}
            >
              <Stack.Screen name="Splash" component={SplashScreen} />
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="OTPValidation" component={OTPValidation} />
              <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
              <Stack.Screen name="Password_retype_password" component={PasswordRetypePassword} />
              <Stack.Screen name="PortfolioScreen" component={MainDrawer} />
              <Stack.Screen name="SummaryScreen" component={SummaryScreen} />
              <Stack.Screen name="ApprovalTimelineScreen" component={ApprovalTimelineScreen} />
              <Stack.Screen name="StatementScreen" component={StatementScreen} />
              <Stack.Screen name="InstructionScreen" component={InstructionScreen} />
              <Stack.Screen name="DrawInstructionScreen" component={DrawInstructionScreen} />
              <Stack.Screen name="LimitRangeScreen" component={LimitRangeScreen} />
              <Stack.Screen name="WithdrawTimelineScreen" component={ApprovalFlowScreen} />
              <Stack.Screen name="InstructionReviewScreen" component={InstructionReviewScreen} />
            </Stack.Navigator>
          </NavigationContainer>
        </View>
      </TouchableWithoutFeedback>
    </PaperProvider>
  );
}

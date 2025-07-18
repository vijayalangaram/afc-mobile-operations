import React from 'react';
import { StyleSheet, SafeAreaView } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import DashboardContent from './DashboardContent';
import InstructionsScreen from './InstructionsScreen';

const Tab = createBottomTabNavigator();

const DashboardScreen: React.FC = () => {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={[styles.safeArea, { paddingBottom: 0 }]}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ color, size }) => {
            let iconName = 'view-dashboard';

            if (route.name === 'Dashboard') iconName = 'view-dashboard';
            else if (route.name === 'Instructions') iconName = 'file-document-outline';

            return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#2148b8',
          tabBarInactiveTintColor: '#6c757d',
          tabBarStyle: {
            backgroundColor: '#ffffff',
            paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
            paddingTop: 8,
            height: 60 + (insets.bottom > 0 ? insets.bottom : 8),
            borderTopWidth: 1,
            borderTopColor: '#e0e0e0',
          },
          headerShown: false,
        })}
      >
        <Tab.Screen name="Dashboard" component={DashboardContent} />
        <Tab.Screen name="Instructions" component={InstructionsScreen} />
      </Tab.Navigator>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
});

export default DashboardScreen;
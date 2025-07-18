import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import * as LocalAuthentication from 'expo-local-authentication';
import AuthService from '../services/AuthService';
import { UserInfo } from '../types/auth.types';

type RootStackParamList = {
  Login: undefined;
  Welcome: { userInfo?: UserInfo };
  Dashboard: undefined;
};

type WelcomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Welcome'>;
type WelcomeScreenRouteProp = RouteProp<RootStackParamList, 'Welcome'>;

interface Props {
  navigation: WelcomeScreenNavigationProp;
  route: WelcomeScreenRouteProp;
}

const WelcomeScreen: React.FC<Props> = ({ navigation, route }) => {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(route.params?.userInfo || null);
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);

  useEffect(() => {
    checkBiometricSupport();
    if (!userInfo) {
      loadUserInfo();
    }
  }, [userInfo]);

  const checkBiometricSupport = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

      if (hasHardware && supportedTypes.length > 0) {
        setIsBiometricSupported(true);
        handleBiometricAuth();
      }
    } catch (error) {
      console.error('Biometric check error:', error);
    }
  };

  const handleBiometricAuth = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to continue',
        cancelLabel: 'Cancel',
      });

      if (result.success) {
        navigation.navigate('Dashboard');
      } else {
        Alert.alert('Authentication Failed', 'Biometric authentication failed or was canceled');
      }
    } catch (error) {
      console.error('Biometric auth error:', error);
      Alert.alert('Error', 'Biometric authentication error occurred');
    }
  };

  const loadUserInfo = async (): Promise<void> => {
    try {
      const tokens = await AuthService.getStoredTokens();
      if (tokens?.accessToken) {
        const info = await AuthService.getUserInfo(tokens.accessToken);
        setUserInfo(info);
      }
    } catch (error) {
      console.error('Load user info error:', error);
    }
  };

  const handleLogout = async (): Promise<void> => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          onPress: async () => {
            const result = await AuthService.logout();
            if (result.success) {
              navigation.replace('Login');
            } else {
              Alert.alert('Logout Failed', result.error || 'Logout failed');
            }
          },
        },
      ]
    );
  };

  const handleNavigateToDashboard = (): void => {
    navigation.navigate('Dashboard');
  };

  const getInitials = (name: string): string => {
    return name ? name.charAt(0).toUpperCase() : 'U';
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome!</Text>
        <Text style={styles.subtitle}>You have successfully signed in</Text>
      </View>

      {userInfo && (
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {getInitials(userInfo.displayName)}
            </Text>
          </View>

          <View style={styles.userInfo}>
            <Text style={styles.userName}>{userInfo.displayName || 'User'}</Text>
            <Text style={styles.userEmail}>{userInfo.mail || userInfo.userPrincipalName}</Text>
            {userInfo.jobTitle && (
              <Text style={styles.userJobTitle}>{userInfo.jobTitle}</Text>
            )}
          </View>
        </View>
      )}

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Authentication Status</Text>
        <Text style={styles.infoText}>✅ Successfully authenticated with Microsoft</Text>
        {isBiometricSupported && (
          <Text style={styles.infoText}>🔐 Biometric authentication available</Text>
        )}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.dashboardButton} onPress={handleNavigateToDashboard}>
          <Text style={styles.dashboardButtonText}>Go to Dashboard</Text>
        </TouchableOpacity>

        {isBiometricSupported && (
          <TouchableOpacity
            style={styles.biometricButton}
            onPress={handleBiometricAuth}
          >
            <Text style={styles.biometricButtonText}>Use Biometrics</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

// Add these new styles to your existing StyleSheet
const styles = StyleSheet.create({
  biometricButton: {
    backgroundColor: '#34a853',
    paddingVertical: 15,
    borderRadius: 5,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 15,
  },
  biometricButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  userCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#0078d4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  avatarText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  userJobTitle: {
    fontSize: 14,
    color: '#0078d4',
    fontStyle: 'italic',
  },
  infoCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 30,
    padding: 20,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  dashboardButton: {
    backgroundColor: '#0078d4',
    marginBottom: 15,
    paddingVertical: 15,
    borderRadius: 5,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dashboardButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#d83b01',
    paddingVertical: 15,
    borderRadius: 5,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default WelcomeScreen;
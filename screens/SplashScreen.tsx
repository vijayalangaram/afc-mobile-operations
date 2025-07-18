// screens/SplashScreen.tsx
import React, { useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Text, Animated, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import AuthService from '../services/AuthService';

type SplashNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Splash'>;

const SplashScreen: React.FC = () => {
  const navigation = useNavigation<SplashNavigationProp>();
  const slideAnim = useRef(new Animated.Value(Dimensions.get('window').height)).current;

  useEffect(() => {
    // Start animation
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    // Check auth status and navigate
    const checkAuthAndNavigate = async () => {
      try {
        const isAuthenticated = await AuthService.isAuthenticated();

        // Wait for animation to complete + additional time
        setTimeout(() => {
          if (isAuthenticated) {
            navigation.replace('Welcome');
          } else {
            navigation.replace('Login');
          }
        }, 2500);
      } catch (error) {
        console.error('Auth check error:', error);
        setTimeout(() => {
          navigation.replace('Login');
        }, 2500);
      }
    };

    checkAuthAndNavigate();
  }, [navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Animated.Image
          source={require('../assets/afc_logo_animation_hd.gif')}
          style={[styles.logo, { transform: [{ translateY: slideAnim }] }]}
        />
      </View>
      <Text style={styles.footerText}>
        Copyright © 2007–2024 Africa Finance Corporation.{"\n"}All rights reserved.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 40,
  },
  logoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
    resizeMode: 'cover',
  },
  footerText: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
});

export default SplashScreen;
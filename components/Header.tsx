import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AuthService from '../services/AuthService';
import { UserInfo } from '../types/auth.types';
import { decodeIdToken } from '../utils/jwt';

// Responsive helper functions
const { width: screenWidth } = Dimensions.get('window');
const isTablet = screenWidth >= 768;

const responsiveWidth = (percentage: number) => (screenWidth * percentage) / 100;
const responsiveFontSize = (size: number) => {
  const scale = screenWidth / 375; // Base width (iPhone 6/7/8)
  return Math.round(size * scale);
};

const Header: React.FC = () => {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const fetchUserInfo = async () => {
      const tokens = await AuthService.getStoredTokens();

      if (tokens?.idToken) {
        const decoded = decodeIdToken(tokens.idToken);
        if (decoded.name) {
          setUserInfo({
            displayName: decoded.name || 'User',
            mail: decoded.email || decoded.preferred_username || '',
            jobTitle: decoded.jobTitle || '',
            userPrincipalName: decoded.preferred_username || '',
          });
        } else if (tokens.accessToken) {
          const info = await AuthService.getUserInfo(tokens.accessToken);
          setUserInfo(info);
        }
      }
    };
    fetchUserInfo();
  }, []);

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((n) => n.charAt(0).toUpperCase())
      .join('');
  };

  const handleLogout = async () => {
    await AuthService.logout();
    setModalVisible(false);
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => setModalVisible(true)} 
          style={styles.avatar}
          accessibilityLabel="User profile"
        >
          <Text style={styles.avatarText}>
            {getInitials(userInfo?.displayName || 'U')}
          </Text>
        </TouchableOpacity>

        <View style={styles.rightSection}>
          <Image
            source={require('../assets/TopNavbar.png')}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel="AFC Traverse Logo"
          />
        </View>

        {/* Modal Drawer */}
        <Modal visible={modalVisible} animationType="slide" transparent={true}>
          <SafeAreaView style={styles.modalSafeArea}>
            <View style={styles.modalOverlay}>
              <View style={styles.drawer}>
                <View style={styles.drawerHeader}>
                  <Image
                    source={require('../assets/AfcTraverseLogo.png')}
                    style={styles.logo}
                    resizeMode="contain"
                  />
                  <TouchableOpacity 
                    onPress={() => setModalVisible(false)}
                    accessibilityLabel="Close menu"
                  >
                    <Text style={styles.closeButton}>✕</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.profileSection}>
                  <View style={styles.avatarLarge}>
                    <Text style={styles.avatarTextLarge}>
                      {getInitials(userInfo?.displayName || 'U')}
                    </Text>
                  </View>
                  <Text style={styles.name}>{userInfo?.displayName}</Text>
                  <Text style={styles.company}>Africa Finance Corporation</Text>
                  {userInfo?.jobTitle && (
                    <Text style={styles.jobTitle}>{userInfo.jobTitle}</Text>
                  )}
                </View>

                <TouchableOpacity 
                  onPress={handleLogout} 
                  style={styles.logoutButton}
                  accessibilityLabel="Log out"
                >
                  <Text style={styles.logoutText}>Log Out ↩</Text>
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#031A66',
  },
  modalSafeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    backgroundColor: '#031A66',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: responsiveWidth(4),
    paddingVertical: responsiveWidth(3),
    height: isTablet ? 70 : 60,
  },
  avatar: {
    width: isTablet ? 44 : 36,
    height: isTablet ? 44 : 36,
    borderRadius: isTablet ? 22 : 18,
    backgroundColor: '#e5e5e5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontWeight: 'bold',
    color: '#031A66',
    fontSize: isTablet ? responsiveFontSize(16) : responsiveFontSize(14),
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: isTablet ? responsiveWidth(25) : responsiveWidth(30),
    height: isTablet ? 40 : 30,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#00000088',
    justifyContent: 'flex-start',
  },
  drawer: {
    backgroundColor: '#fff',
    width: '100%',
    padding: isTablet ? 30 : 20,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: isTablet ? 30 : 20,
  },
  closeButton: {
    fontSize: isTablet ? 30 : 24,
    fontWeight: 'bold',
    color: '#031A66',
  },
  profileSection: {
    alignItems: 'center',
    marginVertical: isTablet ? 30 : 20,
  },
  avatarLarge: {
    width: isTablet ? 80 : 60,
    height: isTablet ? 80 : 60,
    borderRadius: isTablet ? 40 : 30,
    backgroundColor: '#031A66',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  avatarTextLarge: {
    color: '#fff',
    fontSize: isTablet ? 32 : 24,
    fontWeight: 'bold',
  },
  name: {
    fontSize: isTablet ? responsiveFontSize(22) : responsiveFontSize(18),
    fontWeight: 'bold',
    color: '#031A66',
    marginBottom: 5,
  },
  company: {
    fontSize: isTablet ? responsiveFontSize(16) : responsiveFontSize(14),
    color: '#666',
    marginBottom: 5,
  },
  jobTitle: {
    fontSize: isTablet ? responsiveFontSize(16) : responsiveFontSize(14),
    color: '#0078d4',
    fontStyle: 'italic',
  },
  logoutButton: {
    backgroundColor: '#dc3545',
    padding: isTablet ? 16 : 12,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 20,
  },
  logoutText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: isTablet ? responsiveFontSize(18) : responsiveFontSize(16),
  },
});

export default Header;
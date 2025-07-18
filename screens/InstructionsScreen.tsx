import React, { useState, useEffect, useRef } from 'react';
import { TextInput, View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import ApiService from '../services/ApiService';
import Header from '../components/Header';
import { formatCurrency } from "./format";
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

type InstructionItem = {
  id: string;
  customerId: string;
  customerName: string;
  accountName: string;
  accountId: string;
  amount: number;
  beneficiaryName: string;
  txnReferenceId: string;
  currencyType: string;
  instructionDescription: string;
  requestedDate: string;
  canApprove: boolean;
  pendingAction: string | null;
};

const Tab = createMaterialTopTabNavigator();

// Configure notifications handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const InstructionsScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Header />
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Instructions</Text>
      </View>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: '#2148b8',
          tabBarInactiveTintColor: '#6c757d',
          tabBarIndicatorStyle: { backgroundColor: '#2148b8', height: 3 },
          tabBarLabelStyle: { fontSize: 14, fontWeight: 'bold', textTransform: 'none' },
          tabBarStyle: { backgroundColor: '#ffffff', elevation: 0, shadowOpacity: 0 },
          tabBarPressColor: '#f0f0f0',
        }}
      >
        <Tab.Screen name="Pending" component={() => <InstructionList statusId={1} />} />
        <Tab.Screen name="Accepted" component={() => <InstructionList statusId={2} />} />
        <Tab.Screen name="Rejected" component={() => <InstructionList statusId={3} />} />
      </Tab.Navigator>
    </View>
  );
};

const InstructionList: React.FC<{ statusId: number }> = ({ statusId }) => {
  const navigation = useNavigation();
  const [instructions, setInstructions] = useState<InstructionItem[]>([]);
  const [filteredInstructions, setFilteredInstructions] = useState<InstructionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const lastNotifiedIds = useRef<string[]>([]);

  useEffect(() => {
    registerForPushNotifications();
    loadInstructions();
  }, [statusId]);

  useEffect(() => {
    filterInstructions();
  }, [instructions, searchQuery]);

  const registerForPushNotifications = async () => {
    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return;
      }

      if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }
    } else {
      console.log('Must use physical device for Push Notifications');
    }
  };

  const loadInstructions = async () => {
    try {
      setLoading(true);
      const response = await ApiService.get<{ data: InstructionItem[] }>(
        `withdraw-instruction/status?statusId=${statusId}`
      );

      if (response.success && response.data) {
        setInstructions(response.data);

        // For pending instructions, check for new ones and notify
        if (statusId === 1) {
          const newInstructions = response.data.filter(
            item => !lastNotifiedIds.current.includes(item.id)
          );

          if (newInstructions.length > 0) {
            await Notifications.scheduleNotificationAsync({
              content: {
                title: 'New Pending Instructions',
                body: `You have ${newInstructions.length} new pending instructions to review`,
                sound: true,
                data: { screen: 'Instructions' },
              },
              trigger: null,
            });

            lastNotifiedIds.current = response.data.map(item => item.id);
          }
        }
      }
    } catch (error) {
      console.error('Error loading instructions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterInstructions = () => {
    if (!searchQuery.trim()) {
      setFilteredInstructions(instructions);
      return;
    }

    const filtered = instructions.filter(instruction =>
      instruction.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      instruction.accountName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      instruction.txnReferenceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      instruction.instructionDescription.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredInstructions(filtered);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadInstructions();
  };

  const toggleCardExpansion = (id: string) => {
    const newExpandedCards = new Set(expandedCards);
    if (newExpandedCards.has(id)) {
      newExpandedCards.delete(id);
    } else {
      newExpandedCards.add(id);
    }
    setExpandedCards(newExpandedCards);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusTitle = () => {
    switch (statusId) {
      case 1: return 'Review Instruction - Pending';
      case 2: return 'Review Instruction - Accepted';
      case 3: return 'Review Instruction - Rejected';
      default: return 'Review Instruction';
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2148b8" />
      </View>
    );
  }

  return (
    <View style={styles.listContainer}>
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <MaterialCommunityIcons name="magnify" size={20} color="#6c757d" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            placeholderTextColor="#6c757d"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{getStatusTitle()}</Text>
      </View>

      <FlatList
        data={filteredInstructions}
        keyExtractor={(item) => item.id}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        renderItem={({ item }) => {
          const isExpanded = expandedCards.has(item.id);
          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <Text style={styles.customerName}>{item.customerName}</Text>
                  <Text style={styles.date}>{formatDate(item.requestedDate)}</Text>
                </View>
                <View style={styles.cardHeaderRight}>
                  <Text style={styles.amount}>
                    {formatCurrency(item.currencyType, item.amount)}
                  </Text>
                  <TouchableOpacity
                    style={styles.reviewButton}
                    onPress={() =>
                      navigation.navigate("InstructionReviewScreen", {
                        instruction: item.id,
                        statusId: statusId.toString(),
                      })
                    }
                  >
                    <Text style={styles.reviewButtonText}>Review</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.accountNameContainer}>
                <Text style={styles.accountLabel}>Account Name</Text>
                <View style={styles.accountNameRow}>
                  <Text style={styles.accountName}>{item.accountName}</Text>
                  <TouchableOpacity
                    onPress={() => toggleCardExpansion(item.id)}
                    style={styles.expandButton}
                  >
                    <MaterialCommunityIcons
                      name={isExpanded ? "chevron-up" : "chevron-down"}
                      size={20}
                      color="#6c757d"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {isExpanded && (
                <View style={styles.expandedContent}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Account ID</Text>
                    <Text style={styles.infoValue}>{item.accountId}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Instruction ID</Text>
                    <Text style={styles.infoValue}>{item.txnReferenceId}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Instruction Detail</Text>
                    <Text style={styles.infoValue}>{item.instructionDescription}</Text>
                  </View>
                </View>
              )}
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No instructions found</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  headerContainer: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  listContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#ffffff',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  sectionHeader: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  cardHeaderLeft: {
    flex: 1,
  },
  cardHeaderRight: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  customerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    color: '#6c757d',
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  reviewButton: {
    backgroundColor: '#2148b8',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 4,
  },
  reviewButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  accountNameContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  accountLabel: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 4,
  },
  accountNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accountName: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  expandButton: {
    padding: 4,
  },
  expandedContent: {
    padding: 16,
    backgroundColor: '#f8f9fa',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6c757d',
    width: 120,
    marginRight: 8,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  expandedFooter: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
  expandedReviewButton: {
    backgroundColor: '#2148b8',
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 4,
  },
  expandedReviewButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
  },
});

export default InstructionsScreen;
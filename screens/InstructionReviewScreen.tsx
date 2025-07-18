import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  Linking,
  TextInput,
  Platform,
  StatusBar,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import ApiService from '../services/ApiService';
import ApprovalFlowTimeline from './ApprovalFlowTimeline';
import Header from '../components/Header';
import { formatCurrency } from "./format";

const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0;

// const formatCurrency = (currencyCode: string, amount: number | string): string => {
//   const numericValue = typeof amount === 'string' ? parseFloat(amount) : amount;

//   if (isNaN(numericValue) || numericValue == null) {
//     return '0.00';
//   }

//   if (!currencyCode || typeof currencyCode !== 'string') {
//     return numericValue.toFixed(2);
//   }

//   try {
//     return new Intl.NumberFormat('en-US', {
//       style: 'currency',
//       currency: currencyCode,
//     }).format(numericValue);
//   } catch (e) {
//     return `${currencyCode} ${numericValue.toFixed(2)}`;
//   }
// };

const DetailRow: React.FC<{
  label: string;
  value: string;
  valueStyle?: any;
  multiline?: boolean;
}> = ({ label, value, valueStyle, multiline }) => (
  <View style={[styles.detailRow, multiline && styles.detailRowMultiline]}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text
      style={[styles.detailValue, valueStyle]}
      numberOfLines={multiline ? undefined : 1}
    >
      {value || 'N/A'}
    </Text>
  </View>
);

const InstructionReviewScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { instruction, statusId } = route.params;

  const [detailsData, setDetailsData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [timelineVisible, setTimelineVisible] = useState(false);
  const [comments, setComments] = useState('');

  useEffect(() => {
    const loadDetails = async () => {
      setInitialLoading(true);
      try {
        const response = await ApiService.get(`/withdraw-instruction/withdraw-details?instructionId=${instruction}&statusId=${statusId}`);
        if (response && response.success) {
          setDetailsData(response.data);
        } else {
          Alert.alert('Error', 'Failed to fetch instruction details');
        }
      } catch (err) {
        console.error(err);
        Alert.alert('Error', 'Failed to load instruction details.');
      } finally {
        setInitialLoading(false);
      }
    };
    loadDetails();
  }, [instruction, statusId]);

  const openPdf = async (url: string) => {
    if (!url) {
      Alert.alert('Error', 'No PDF file available');
      return;
    }

    const fullPdfUrl = url.startsWith('http') ? url : `${ApiService.baseURL}${url}`;

    setLoading(true);
    try {
      const supported = await Linking.canOpenURL(fullPdfUrl);

      if (!supported) {
        Alert.alert('Error', 'No app available to handle PDF files. Please install a PDF viewer.');
      } else {
        await Linking.openURL(fullPdfUrl);
      }
    } catch (err) {
      console.error('Error opening PDF:', err);
      Alert.alert('Error', 'Failed to open PDF. Please check your internet connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (newStatusId: number) => {
    if (!comments.trim()) {
      Alert.alert('Error', 'Please enter comments before submitting.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        instructionId: instruction,
        isChargePercenatage: false,
        charges: 0,
        statusUpdateDTO: {
          statusId: newStatusId,
          approverId: '', // Populate with actual approverId if available
          comments,
        },
      };
      await ApiService.post('/withdraw-instruction/update-withdraw-Operation', payload);
      Alert.alert('Success', newStatusId === 2 ? 'Instruction approved successfully' : 'Instruction rejected successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', newStatusId === 2 ? 'Failed to approve instruction' : 'Failed to reject instruction');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#2148b8" />
        </View>
      </SafeAreaView>
    );
  }

  const instructionDetails = detailsData?.instructionApprovalDTO;
  const canApprove = instructionDetails?.canApprove || statusId === '1';

  return (
    <SafeAreaView style={styles.container}>
      {/* Timeline Card */}

      <Header />

      <TouchableOpacity style={styles.timelineCard} onPress={() => setTimelineVisible(true)}>
        <Text style={styles.timelineText}>Approval Timeline</Text>
        <MaterialCommunityIcons name="chevron-right" size={20} color="#003087" />
      </TouchableOpacity>

      {/* Timeline Modal */}
      <Modal
        visible={timelineVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setTimelineVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 16 }}
            showsVerticalScrollIndicator={true}
          >
            <ApprovalFlowTimeline
              instructionData={detailsData}
              onClose={() => setTimelineVisible(false)}
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#2148b8" />
        </View>
      )}

      {/* Main Content */}
      <View style={styles.content}>
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={[
            styles.scrollContent,
            canApprove && styles.scrollContentWithButtons
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Amount Details Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Amount Details</Text>
            <View style={styles.sectionContent}>
              <DetailRow
                label="Draw Amount"
                value={
                  instructionDetails?.amount
                    ? formatCurrency(
                      detailsData?.currencyValue || 'USD',
                      instructionDetails?.amount
                    )
                    : 'N/A'
                }
                valueStyle={styles.amountValue}
              />
              <DetailRow
                label="Available balance"
                value={
                  detailsData?.availableBalance
                    ? formatCurrency(
                      detailsData?.currencyValue || 'USD',
                      detailsData?.availableBalance
                    )
                    : 'N/A'
                }
                valueStyle={styles.balanceValue}
              />
            </View>
          </View>

          {/* Bank Details Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bank Details</Text>
            <View style={styles.sectionContent}>
              <DetailRow
                label="Bank Name"
                value={detailsData?.bankName || 'N/A'}
              />
              <DetailRow
                label="Bank Swift Code"
                value={detailsData?.bankSwiftCode || 'N/A'}
              />
              <DetailRow
                label="Beneficiary Name"
                value={detailsData?.beneficiaryName || 'N/A'}
              />
              <DetailRow
                label="Account Number/IBAN"
                value={detailsData?.accountNumber || 'N/A'}
              />
              <DetailRow
                label="Bank Routing Number/Sort Code"
                value={
                  detailsData?.bankRoutingNumber ||
                  detailsData?.sortCode ||
                  'N/A'
                }
              />
              <DetailRow label="Charges" value={detailsData?.charges || 'N/A'} />
              <DetailRow
                label="Intermediary Bank Swift Code"
                value={instructionDetails?.intermediateBankSwiftCode || 'N/A'}
              />
              <DetailRow
                label="Intermediary Bank Name"
                value={instructionDetails?.intermediateBankName || 'N/A'}
              />
            </View>
          </View>

          {/* Draw Instruction Details Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Draw Instruction Details</Text>
            <View style={styles.sectionContent}>
              <DetailRow
                label="Instruction Detail"
                value={detailsData?.instructionDescription || 'N/A'}
                multiline
              />
              <View style={styles.attachmentRow}>
                <Text style={styles.attachmentLabel}>
                  Attach instruction letter
                </Text>
                <View style={styles.attachmentContent}>
                  <View style={styles.pdfIcon}>
                    <MaterialCommunityIcons
                      name="file-pdf-box"
                      size={24}
                      color="#E53935"
                    />
                  </View>
                  <Text style={styles.attachmentFileName}>
                    {detailsData?.instructionLetterUrl
                      ? 'Instruction Letter.pdf'
                      : 'No file available'}
                  </Text>
                  <TouchableOpacity
                    onPress={() => openPdf(detailsData?.instructionLetterUrl || '')}
                    disabled={!detailsData?.instructionLetterUrl}
                    style={[
                      styles.downloadIconContainer,
                      !detailsData?.instructionLetterUrl && styles.disabledButton,
                    ]}
                  >
                    <Text style={styles.viewButton}>
                      {detailsData?.instructionLetterUrl ? 'View' : null}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          {/* Comments Section - Only show if can approve */}
          {canApprove && (
            <View style={styles.section}>
              <Text style={styles.commentsLabel}>Comments*</Text>
              <TextInput
                style={styles.commentsInput}
                placeholder="Add Comments"
                multiline
                numberOfLines={4}
                value={comments}
                onChangeText={setComments}
                textAlignVertical="top"
              />
            </View>
          )}
        </ScrollView>

        {/* Action Buttons - Only show if can approve */}
        {canApprove && (
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.rejectButton,
                !comments.trim() && styles.disabledButton,
              ]}
              onPress={() => handleAction(3)}
              disabled={!comments.trim()}
            >
              <Text style={styles.rejectButtonText}>Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.approveButton,
                !comments.trim() && styles.disabledButton,
              ]}
              onPress={() => handleAction(2)}
              disabled={!comments.trim()}
            >
              <Text style={styles.approveButtonText}>Approve</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    position: 'relative',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  scrollContentWithButtons: {
    paddingBottom: 120,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  timelineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    backgroundColor: '#EAF4FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1976D2',
  },
  timelineText: {
    fontSize: 14,
    color: '#003087',
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  section: {
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976D2',
    marginBottom: 12,
  },
  sectionContent: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 24,
  },
  detailRowMultiline: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 4,
  },
  detailLabel: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
    flex: 1,
    textAlign: 'right',
  },
  amountValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  balanceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  attachmentRow: {
    marginTop: 8,
  },
  attachmentLabel: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  attachmentContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  pdfIcon: {
    backgroundColor: '#FDECEA',
    borderRadius: 25,
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  attachmentFileName: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  downloadIconContainer: {
    padding: 4,
  },
  disabledButton: {
    opacity: 0.5,
  },
  viewButton: {
    color: '#007AFF',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
    fontSize: 16,
  },
  commentsLabel: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  commentsInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
    padding: 12,
    fontSize: 14,
    minHeight: 100,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Platform.OS === 'ios' ? 34 : 12,
  },
  actionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
    minHeight: 44,
  },
  approveButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#f44336',
  },
  approveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  rejectButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default InstructionReviewScreen;
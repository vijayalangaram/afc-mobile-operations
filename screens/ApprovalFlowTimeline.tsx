import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { formatCurrency } from "./format";

const formatDate = (dateString: string) => {
  if (!dateString || dateString === '0001-01-01T00:00:00') {
    return 'N/A';
  }
  return new Date(dateString).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

// const formatCurrency = (amount: number | string, currency: string) => {
//   if (!amount) return 'N/A';
//   const numericValue = typeof amount === 'string' ? parseFloat(amount) : amount;

//   try {
//     return new Intl.NumberFormat('en-US', {
//       style: 'currency',
//       currency: currency || 'USD',
//     }).format(numericValue);
//   } catch (e) {
//     return `${currency || 'USD'} ${numericValue.toFixed(2)}`;
//   }
// };

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'accepted':
      return '#0B835C';
    case 'rejected':
      return '#D93E3E';
    case 'pending':
      return '#B2881A';
    default:
      return '#00205C';
  }
};

const ApprovalFlowTimeline = ({ instructionData, onClose }) => {
  const renderStepLine = (show: boolean) =>
    show && <View style={styles.verticalLine} />;

  const renderTimelineRow = (label: string, value: string | number) => (
    <View style={styles.timelineItemRow}>
      <Text style={styles.timelineItemLabel}>{label}</Text>
      <Text style={styles.timelineItemValue}>{value || 'N/A'}</Text>
    </View>
  );

  const renderTimelineBlock = (number: number, label: string, children: React.ReactNode, showLine: boolean = true) => (
    <View style={styles.timelineStep}>
      <View style={styles.stepIndicator}>
        <View style={styles.stepCircle}>
          <Text style={styles.stepNumber}>{number}</Text>
        </View>
        {renderStepLine(showLine)}
      </View>
      <View style={styles.timelineDetails}>
        <Text style={styles.timelineLabel}>{label}</Text>
        {children}
      </View>
    </View>
  );

  const renderSubStepRow = (person: any, index: number) => (
    <View key={index} style={styles.subStepRow}>
      <View style={styles.subStepCircle}>
        <Text style={styles.subStepNumber}>{index + 1}</Text>
      </View>
      <View style={styles.subStepDetails}>
        {renderTimelineRow('Name -', person.checkerName || person.approverName || person.adminName)}
        {renderTimelineRow('Date -', formatDate(person.reviewDate || person.reviwedDate))}
        <View style={styles.timelineItemRow}>
          <Text style={styles.timelineItemLabel}>Status -</Text>
          <Text style={[
            styles.timelineItemValue,
            { color: getStatusColor(person.status) }
          ]}>
            {person.status || 'N/A'}
          </Text>
        </View>
        {renderTimelineRow('Comments -', person.comments)}
      </View>
    </View>
  );

  if (!instructionData) {
    return (
      <View style={styles.container}>
        <Text style={styles.noDataText}>No approval flow data available</Text>
      </View>
    );
  }

  const approvalData = instructionData.instructionApprovalDTO;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.timelineContainer}>
          <View style={styles.headerRow}>
            <Text style={styles.sectionTitle}>Approval Timeline</Text>
            <TouchableOpacity style={styles.closeIcon} onPress={onClose}>
              <MaterialIcons name="close" size={24} color="#00205C" />
            </TouchableOpacity>
          </View>

          {/* Step 1: Initiator */}
          {renderTimelineBlock(
            1,
            'Initiator',
            <>
              {renderTimelineRow('Maker -', approvalData?.makerName)}
              {renderTimelineRow('Initiated Date -', formatDate(approvalData?.initiatedDate))}
              {renderTimelineRow('Amount -', formatCurrency(approvalData?.currencyValue, approvalData?.amount))}
              {renderTimelineRow('Charges -', approvalData?.charges)}
              {renderTimelineRow('Reference Id -', approvalData?.txnReferenceId)}
              {renderTimelineRow('Project -', approvalData?.project)}
              {renderTimelineRow('Bank -', approvalData?.beneficiaryBank)}
              {renderTimelineRow('Account Number -', approvalData?.accountNumber)}
              {renderTimelineRow('SWIFT Code -', approvalData?.swiftCode)}
            </>,
            approvalData?.checkers?.length > 0 || approvalData?.approvers?.length > 0 || approvalData?.operationals?.length > 0
          )}

          {/* Step 2: Checker */}
          {approvalData?.checkers?.length > 0 && renderTimelineBlock(
            2,
            'Checker',
            <>
              {approvalData.checkers.map((checker: any, index: number) =>
                renderSubStepRow(checker, index)
              )}
            </>,
            approvalData?.approvers?.length > 0 || approvalData?.operationals?.length > 0
          )}

          {/* Step 3: Approver */}
          {approvalData?.approvers?.length > 0 && renderTimelineBlock(
            3,
            'Approver',
            <>
              {approvalData.approvers.map((approver: any, index: number) =>
                renderSubStepRow(approver, index)
              )}
            </>,
            approvalData?.operationals?.length > 0
          )}

          {/* Step 4: Operations Team */}
          {approvalData?.operationals?.length > 0 && renderTimelineBlock(
            4,
            'Operations Team',
            <>
              {approvalData.operationals.map((operational: any, index: number) =>
                renderSubStepRow(operational, index)
              )}
            </>,
            false
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
  },
  timelineContainer: {
    padding: 16,
    backgroundColor: '#fff',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00205C',
  },
  closeIcon: {
    padding: 4,
  },
  noDataText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 50,
  },
  timelineStep: {
    flexDirection: 'row',
    marginBottom: 24,
    position: 'relative',
  },
  stepIndicator: {
    width: 40,
    alignItems: 'center',
  },
  verticalLine: {
    position: 'absolute',
    top: 28,
    width: 2,
    height: '100%',
    backgroundColor: '#00A76F',
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#00A76F',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  stepNumber: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  timelineDetails: {
    flex: 1,
    marginLeft: 8,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  timelineLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00205C',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingBottom: 4,
  },
  timelineItemRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  timelineItemLabel: {
    fontWeight: '600',
    color: '#333',
    marginRight: 4,
    flexShrink: 0,
  },
  timelineItemValue: {
    color: '#00205C',
    flexShrink: 1,
    flex: 1,
  },
  subStepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  subStepCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#00A76F',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 4,
  },
  subStepNumber: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  subStepDetails: {
    flex: 1,
  },
});

export default ApprovalFlowTimeline;
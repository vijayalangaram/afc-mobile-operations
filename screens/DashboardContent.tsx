

// screens/DashboardContent.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Platform,
  TouchableOpacity,
  TextInput
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { BarChart, LineChart } from 'react-native-chart-kit';
import ApiService, { ExistingAccount, ChartData } from '../services/ApiService';
import Header from '../components/Header';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';



const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Responsive helper functions
const isTablet = screenWidth >= 768;
const isLandscape = screenWidth > screenHeight;

const responsiveWidth = (percentage: number) => (screenWidth * percentage) / 100;
const responsiveHeight = (percentage: number) => (screenHeight * percentage) / 100;
const responsiveFontSize = (size: number) => {
  const scale = Math.min(screenWidth / 375, 1.8);
  return Math.round(size * scale);
};

const DashboardContent: React.FC = () => {

  const navigation = useNavigation();
  const [accounts, setAccounts] = useState<ExistingAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [chartLoading, setChartLoading] = useState<boolean>(false);

  // Generate years from 2000 to current year
  const generateYears = (): number[] => {
    const currentYear = new Date().getFullYear();
    const years: number[] = [];
    for (let year = 2000; year <= currentYear; year++) {
      years.push(year);
    }
    return years.reverse();
  };

  const availableYears = generateYears();

  useEffect(() => {
    loadAccounts();
  }, []);

  useEffect(() => {
    if (selectedAccount) {
      loadChartData();
    }
  }, [selectedAccount, selectedYear]);

  const loadAccounts = async () => {
    try {
      const response = await ApiService.getExistingAccounts();
      if (response.success && response.data) {
        setAccounts(response.data);
        if (response.data.length > 0) {
          setSelectedAccount(response.data[0].id);
        }
      } else {
        console.error('Failed to load accounts:', response.error);
      }
    } catch (error) {
      console.error('Error loading accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadChartData = async () => {
    if (!selectedAccount) return;
    setChartLoading(true);
    try {
      const startDate = `${selectedYear}/01/01`;
      const endDate = `${selectedYear}/12/31`;
      const response = await ApiService.getChartData(selectedAccount, startDate, endDate);
      if (response.success) {
        setChartData(response.data || response);
      } else {
        console.error('Failed to load chart data:', response.error);
      }
    } catch (error) {
      console.error('Error loading chart data:', error);
    } finally {
      setChartLoading(false);
    }
  };

  const prepareInstructionsBarChart = () => {
    if (!chartData?.monthlyInstructions) return null;

    const labels = chartData.monthlyInstructions.map(item => item.month);
    const approvedData = chartData.monthlyInstructions.map(item => item.approvedApplications);
    const rejectedData = chartData.monthlyInstructions.map(item => item.rejectedApplications);

    const hasData = approvedData.some(val => val > 0) || rejectedData.some(val => val > 0);

    if (!hasData) {
      return null;
    }

    return {
      labels,
      datasets: [
        {
          data: approvedData,
          color: (opacity = 1) => `rgba(3, 26, 102, ${opacity})`,
          strokeWidth: 2,
        },
        {
          data: rejectedData,
          color: (opacity = 1) => `rgba(176, 192, 214, ${opacity})`,
          strokeWidth: 2,
        },
      ],
      legend: ['Accepted Instructions', 'Rejected Instructions'],
    };
  };

  const prepareAmountLineChart = () => {
    if (!chartData?.monthlyAmount) return null;

    const labels = chartData.monthlyAmount.map(item => item.month);
    const creditedData = chartData.monthlyAmount.map(item => item.creditedAmount);
    const debitedData = chartData.monthlyAmount.map(item => item.debitedAmount);
    const interestData = chartData.monthlyAmount.map(item => item.interestAmount);

    const hasData = creditedData.some(val => val > 0) ||
      debitedData.some(val => val > 0) ||
      interestData.some(val => val > 0);

    if (!hasData) {
      return null;
    }
    return {
      labels,
      datasets: [
        {
          data: creditedData,
          color: (opacity = 1) => `rgba(3, 26, 102, ${opacity})`,
          strokeWidth: 3,
        },
        {
          data: debitedData,
          color: (opacity = 1) => `rgba(44, 155, 240, ${opacity})`,
          strokeWidth: 3,
        },
        {
          data: interestData,
          color: (opacity = 1) => `rgba(45, 199, 164, ${opacity})`,
          strokeWidth: 3,
        },
      ],
      legend: ['Credited Amount', 'Debited Amount', 'Interest Amount'],
    };
  };

  const chartConfig = {
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    strokeWidth: 2,
    barPercentage: isTablet ? 0.7 : 0.6,
    useShadowColorFromDataset: false,
    propsForLabels: {
      fontSize: isTablet ? 12 : 10,
    },
    propsForVerticalLabels: {
      fontSize: isTablet ? 12 : 10,
    },
    propsForHorizontalLabels: {
      fontSize: isTablet ? 12 : 10,
    },
    fillShadowGradient: '#ffffff',
    fillShadowGradientOpacity: 0,
    decimalPlaces: 0,
  };

  const NoDataMessage = ({ message }: { message: string }) => (
    <View style={styles.noDataContainer} >
      <Text style={styles.noDataText}> {message} </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer} >
        <ActivityIndicator size="large" color="#2148b8" />
        <Text style={styles.loadingText}> Loading accounts...</Text>
      </View>
    );
  }

  const instructionsBarChart = prepareInstructionsBarChart();
  const amountLineChart = prepareAmountLineChart();

  return (
    <View style={styles.container} >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Header />

        < View style={styles.timelineContainer} >
          <Text style={styles.sectionTitle}>
            Pending Review Items
          </Text>
        </View>

        < TouchableOpacity style={styles.timelineCard} >
          <Text style={styles.timelineText}> Instructions </Text>
          < MaterialCommunityIcons name="chevron-right" size={20} color="#003087" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.chartHeader}
          onPress={() =>
            navigation.navigate('InstructionReviewScreen', {
              // instruction: '', // or use a real ID if needed
              statusId: '1',   // statusId for pending, update as required
            })
          }
        >
          <Text style={styles.chartTitle}>Instructions Trend</Text>
          <Text style={styles.dateRange}>
            Selected Year Range: 01 - Jan - {selectedYear} to 31 - Dec - {selectedYear}
          </Text>
        </TouchableOpacity>

        < View style={styles.filtersContainer} >
          <View style={[styles.filtersRow, isLandscape && styles.filtersRowLandscape]}>
            <View style={[styles.pickerContainer, isLandscape && styles.pickerContainerLandscape]}>
              <Text style={styles.pickerLabel}> Select Account: </Text>
              < View style={styles.pickerWrapper} >
                <Picker
                  selectedValue={selectedAccount}
                  onValueChange={setSelectedAccount}
                  style={[styles.picker, Platform.OS === 'ios' && styles.pickerIOS]}
                  mode="dropdown"
                  dropdownIconColor="#031A66"
                >
                  <Picker.Item label="Choose an account..." value="" />
                  {
                    accounts.map((account) => (
                      <Picker.Item
                        key={account.id}
                        label={account.accountName}
                        value={account.id}
                      />
                    ))
                  }
                </Picker>
              </View>
            </View>

            < View style={[styles.pickerContainer, isLandscape && styles.pickerContainerLandscape]} >
              <Text style={styles.pickerLabel}> Select Year: </Text>
              < View style={styles.pickerWrapper} >
                <Picker
                  selectedValue={selectedYear}
                  onValueChange={(value) => setSelectedYear(value)}
                  style={[styles.picker, Platform.OS === 'ios' && styles.pickerIOS]}
                  mode="dropdown"
                  dropdownIconColor="#031A66"
                >
                  {
                    availableYears.map((year) => (
                      <Picker.Item
                        key={year}
                        label={year.toString()}
                        value={year}
                      />
                    ))
                  }
                </Picker>
              </View>
            </View>
          </View>
        </View>

        {
          chartLoading ? (
            <View style={styles.centerContainer} >
              <ActivityIndicator size="large" color="#2148b8" />
              <Text style={styles.loadingText}> Loading chart data...</Text>
            </View>
          ) : (
            chartData && (
              <View style={styles.chartsContainer} >
                {/* Instructions Trend - Bar Chart */}
                < View style={styles.chartSection} >
                  <View style={styles.chartHeader}>
                    <Text style={styles.chartTitle}> Instructions Trend </Text>
                    < Text style={styles.dateRange} >
                      Selected Year Range: 01 - Jan - {selectedYear} to 31 - Dec - {selectedYear}
                    </Text>
                  </View>
                  {
                    instructionsBarChart ? (
                      <View style={styles.chartWrapper} >
                        <BarChart
                          data={instructionsBarChart}
                          width={responsiveWidth(isTablet ? (isLandscape ? 70 : 85) : 90)
                          }
                          height={responsiveHeight(isTablet ? (isLandscape ? 30 : 25) : 30)
                          }
                          chartConfig={chartConfig}
                          style={styles.chart}
                          showValuesOnTopOfBars={true}
                          fromZero={true}
                          showBarTops={false}
                          yAxisLabel=""
                          yAxisSuffix=""
                          verticalLabelRotation={isLandscape ? 45 : 0}
                        />
                      </View>
                    ) : (
                      <NoDataMessage message="No instruction data available for the selected period" />
                    )}
                </View>

                {/* Amount Trend - Line Chart */}
                <View style={styles.chartSection}>
                  <View style={styles.chartHeader}>
                    <Text style={styles.chartTitle}> Amount Trend </Text>
                    < Text style={styles.dateRange} >
                      Selected Year Range: 01 - Jan - {selectedYear} to 31 - Dec - {selectedYear}
                    </Text>
                  </View>
                  {
                    amountLineChart ? (
                      <View style={styles.chartWrapper} >
                        <LineChart
                          data={amountLineChart}
                          width={responsiveWidth(isTablet ? (isLandscape ? 70 : 85) : 90)
                          }
                          height={responsiveHeight(isTablet ? (isLandscape ? 30 : 25) : 30)}
                          chartConfig={chartConfig}
                          style={styles.chart}
                          bezier={true}
                          fromZero={true}
                          segments={4}
                          verticalLabelRotation={isLandscape ? 45 : 0}
                        />
                      </View>
                    ) : (
                      <NoDataMessage message="No amount data available for the selected period" />
                    )}
                </View>

                {/* Data Summary */}
                <View style={styles.summarySection}>
                  <Text style={styles.summaryTitle}> Year {selectedYear} Summary </Text>
                  < View style={[styles.summaryGrid, isTablet && styles.summaryGridTablet]} >
                    <View style={[styles.summaryItem, styles.greenCard]}>
                      <Text style={styles.summaryLabel}> Total Approved </Text>
                      < Text style={styles.summaryValue} >
                        {chartData.monthlyInstructions?.reduce((sum, item) => sum + item.approvedApplications, 0) || 0}
                      </Text>
                    </View>

                    < View style={[styles.summaryItem, styles.redCard]} >
                      <Text style={styles.summaryLabel}> Total Rejected </Text>
                      < Text style={styles.summaryValue} >
                        {chartData.monthlyInstructions?.reduce((sum, item) => sum + item.rejectedApplications, 0) || 0}
                      </Text>
                    </View>

                    < View style={[styles.summaryItem, styles.blueCard]} >
                      <Text style={styles.summaryLabel}> Credited Amount </Text>
                      < Text style={styles.summaryValue} >
                        ₹{(chartData.monthlyAmount?.reduce((sum, item) => sum + item.creditedAmount, 0) || 0).toFixed(2)}
                      </Text>
                    </View>

                    < View style={[styles.summaryItem, styles.orangeCard]} >
                      <Text style={styles.summaryLabel}> Debited Amount </Text>
                      < Text style={styles.summaryValue} >
                        ₹{(chartData.monthlyAmount?.reduce((sum, item) => sum + item.debitedAmount, 0) || 0).toFixed(2)}
                      </Text>
                    </View>

                    < View style={[styles.summaryItem, styles.tealCard]} >
                      <Text style={styles.summaryLabel}> Interest Amount </Text>
                      < Text style={styles.summaryValue} >
                        ₹{(chartData.monthlyAmount?.reduce((sum, item) => sum + item.interestAmount, 0) || 0).toFixed(2)}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            )
          )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 100, // Add extra padding to prevent overlap with tab bar
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
  timelineContainer: {
    padding: 16,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00205C',
    marginBottom: 16
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  filtersContainer: {
    marginHorizontal: responsiveWidth(5),
    marginVertical: responsiveHeight(2),
  },
  filtersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  filtersRowLandscape: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pickerContainer: {
    backgroundColor: '#ffffff',
    marginBottom: 15,
    padding: responsiveWidth(3),
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    flex: 1,
  },
  pickerContainerLandscape: {
    marginHorizontal: 5,
    marginBottom: 0,
  },
  pickerLabel: {
    fontSize: responsiveFontSize(14),
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
    backgroundColor: '#ffffff',
    minHeight: responsiveHeight(5),
    justifyContent: 'center',
  },
  picker: {
    height: Platform.OS === 'ios' ? responsiveHeight(5) : undefined,
    width: '100%',
  },
  pickerIOS: {
    height: responsiveHeight(5),
  },
  chartsContainer: {
    paddingHorizontal: responsiveWidth(5),
    paddingBottom: responsiveHeight(2),
  },
  chartSection: {
    backgroundColor: '#ffffff',
    marginBottom: responsiveHeight(2),
    borderRadius: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  chartHeader: {
    padding: responsiveWidth(4),
    paddingBottom: responsiveWidth(2),
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  chartTitle: {
    fontSize: responsiveFontSize(16),
    fontWeight: '700',
    color: '#031A66',
  },
  dateRange: {
    fontSize: responsiveFontSize(12),
    color: '#6c757d',
  },
  chartWrapper: {
    paddingVertical: 15,
    paddingHorizontal: 5,
    alignItems: 'center',
  },
  chart: {
    borderRadius: 8,
    marginVertical: 10,
  },
  loadingText: {
    marginTop: 10,
    fontSize: responsiveFontSize(16),
    color: '#666',
  },
  noDataContainer: {
    padding: responsiveWidth(8),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    margin: responsiveWidth(5),
    borderRadius: 8,
  },
  noDataText: {
    fontSize: responsiveFontSize(16),
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  summarySection: {
    backgroundColor: '#ffffff',
    padding: responsiveWidth(4),
    borderRadius: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryTitle: {
    fontSize: responsiveFontSize(18),
    fontWeight: 'bold',
    color: '#2148b8',
    marginBottom: 15,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  summaryGridTablet: {
    justifyContent: 'space-around',
  },
  summaryItem: {
    width: isTablet ? '30%' : '48%',
    backgroundColor: '#f8f9fa',
    padding: responsiveWidth(3),
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
    minHeight: responsiveHeight(8),
    justifyContent: 'center',
  },
  summaryLabel: {
    fontWeight: '500',
    color: '#495057',
    fontSize: responsiveFontSize(12),
    textAlign: 'center',
  },
  summaryValue: {
    fontSize: responsiveFontSize(16),
    fontWeight: 'bold',
    color: '#2148b8',
    textAlign: 'center',
  },
  // Card styles
  greenCard: {
    backgroundColor: '#d4edda',
    borderLeftWidth: 5,
    borderLeftColor: '#28a745',
  },
  redCard: {
    backgroundColor: '#f8d7da',
    borderLeftWidth: 5,
    borderLeftColor: '#dc3545',
  },
  blueCard: {
    backgroundColor: '#d1ecf1',
    borderLeftWidth: 5,
    borderLeftColor: '#007bff',
  },
  orangeCard: {
    backgroundColor: '#fff3cd',
    borderLeftWidth: 5,
    borderLeftColor: '#fd7e14',
  },
  tealCard: {
    backgroundColor: '#d1f5ea',
    borderLeftWidth: 5,
    borderLeftColor: '#20c997',
  },
});

export default DashboardContent;
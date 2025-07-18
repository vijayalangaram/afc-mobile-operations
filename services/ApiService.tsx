// services/ApiService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { currentEnvironment } from '../config/environment';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface ExistingAccount {
  id: string;
  accountName: string;
}

export interface MonthlyInstruction {
  month: string;
  approvedApplications: number;
  rejectedApplications: number;
}

export interface MonthlyAmount {
  month: string;
  creditedAmount: number;
  interestAmount: number;
  debitedAmount: number;
}

export interface ChartData {
  monthlyInstructions: MonthlyInstruction[];
  monthlyAmount: MonthlyAmount[];
}

class ApiService {
  private baseUrl = currentEnvironment.apiUrl;

  private async getAuthHeader(): Promise<{ Authorization: string } | {}> {
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      if (accessToken) {
        return { Authorization: `Bearer ${accessToken}` };
      }
      return {};
    } catch (error) {
      console.error('Error getting auth header:', error);
      return {};
    }
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const authHeader = await this.getAuthHeader();
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...authHeader,
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API request error:', error);
      return {
        success: false,
        message: 'API request failed',
        error: (error as Error).message,
      };
    }
  }

  // Get existing accounts
  async getExistingAccounts(): Promise<ApiResponse<ExistingAccount[]>> {
    return this.makeRequest<ExistingAccount[]>('back-office-review/existing-accounts');
  }

  // Get chart data for specific account with dynamic date range
  async getChartData(
    accountNumber: string,
    startDate?: string,
    endDate?: string
  ): Promise<ApiResponse<ChartData>> {
    // Default to current year if no dates provided
    const currentYear = new Date().getFullYear();
    const defaultStartDate = `${currentYear}/01/01`;
    const defaultEndDate = `${currentYear}/12/31`;
    
    const finalStartDate = startDate || defaultStartDate;
    const finalEndDate = endDate || defaultEndDate;
    
    const endpoint = `back-office-review/chart-data?startDate=${finalStartDate}&endDate=${finalEndDate}&accountNumber=${accountNumber}`;
    
    console.log('Fetching chart data:', {
      accountNumber,
      startDate: finalStartDate,
      endDate: finalEndDate,
      endpoint: `${this.baseUrl}${endpoint}`
    });
    
    return this.makeRequest<ChartData>(endpoint);
  }

  // Helper method to format date for API
  static formatDateForAPI(year: number, month: number = 1, day: number = 1): string {
    const formattedMonth = month.toString().padStart(2, '0');
    const formattedDay = day.toString().padStart(2, '0');
    return `${year}/${formattedMonth}/${formattedDay}`;
  }

  // Helper method to get year range dates
  static getYearDateRange(year: number): { startDate: string; endDate: string } {
    return {
      startDate: this.formatDateForAPI(year, 1, 1),
      endDate: this.formatDateForAPI(year, 12, 31)
    };
  }

  // Generic GET request
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint);
  }

  // Generic POST request
  async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Generic PUT request
  async put<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Generic DELETE request
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: 'DELETE',
    });
  }
}

export default new ApiService();
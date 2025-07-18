import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { currentEnvironment } from '../config/environment';
import { AuthResult, AuthTokens, UserInfo } from '../types/auth.types';

WebBrowser.maybeCompleteAuthSession();

class AuthService {
  private config = currentEnvironment;
  private discovery = {
    authorizationEndpoint: `https://login.microsoftonline.com/${this.config.tenantId}/oauth2/v2.0/authorize`,
    tokenEndpoint: `https://login.microsoftonline.com/${this.config.tenantId}/oauth2/v2.0/token`,
    revocationEndpoint: `https://login.microsoftonline.com/${this.config.tenantId}/oauth2/v2.0/logout`,
  };

  async login(): Promise<AuthResult> {
    try {
      // This will automatically handle both development and production environments
      const redirectUri = AuthSession.makeRedirectUri({
        scheme: undefined, // Let Expo handle the scheme
        path: 'auth'
      });

      console.log('Generated redirect URI:', redirectUri); // For debugging

      const request = new AuthSession.AuthRequest({
        clientId: this.config.clientId,
        scopes: ['openid', 'profile', 'email', this.config.scope],
        responseType: AuthSession.ResponseType.Code,
        redirectUri,
        additionalParameters: {
          tenant: this.config.tenantId,
          prompt: 'select_account',
        },
      });

      const result = await request.promptAsync(this.discovery);

      if (result.type === 'success') {
        const tokenResponse = await AuthSession.exchangeCodeAsync(
          {
            clientId: this.config.clientId,
            code: result.params.code,
            redirectUri,
            extraParams: {
              code_verifier: request.codeVerifier,
            },
          },
          this.discovery
        );

        const tokens: AuthTokens = {
          accessToken: tokenResponse.accessToken,
          refreshToken: tokenResponse.refreshToken,
          idToken: tokenResponse.idToken,
        };

        await this.storeTokens(tokens);
        const userInfo = await this.getUserInfo(tokenResponse.accessToken);

        return {
          success: true,
          tokens,
          userInfo: userInfo || undefined
        };
      }

      return { success: false, error: 'Authentication cancelled' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  async getUserInfo(accessToken: string): Promise<UserInfo | null> {
    try {
      const response = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('Get user info error:', error);
      return null;
    }
  }

  async storeTokens(tokens: AuthTokens): Promise<void> {
    try {
      await AsyncStorage.setItem('accessToken', tokens.accessToken);
      await AsyncStorage.setItem('refreshToken', tokens.refreshToken || '');
      await AsyncStorage.setItem('idToken', tokens.idToken || '');
    } catch (error) {
      console.error('Store tokens error:', error);
    }
  }

  async getStoredTokens(): Promise<AuthTokens | null> {
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      const idToken = await AsyncStorage.getItem('idToken');

      if (!accessToken) return null;

      return {
        accessToken,
        refreshToken: refreshToken || undefined,
        idToken: idToken || undefined,
      };
    } catch (error) {
      console.error('Get stored tokens error:', error);
      return null;
    }
  }

  async logout(): Promise<AuthResult> {
    try {
      await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'idToken', 'userInfo']);
      
      const redirectUri = AuthSession.makeRedirectUri({
        scheme: undefined,
        path: 'logout'
      });

      const logoutUrl = `https://login.microsoftonline.com/${this.config.tenantId}/oauth2/v2.0/logout?post_logout_redirect_uri=${encodeURIComponent(redirectUri)}`;
      
      await WebBrowser.openAuthSessionAsync(logoutUrl, redirectUri);
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  async isAuthenticated(): Promise<boolean> {
    const tokens = await this.getStoredTokens();
    return tokens !== null && tokens.accessToken !== null;
  }
}

export default new AuthService();
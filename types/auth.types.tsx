export interface Environment {
  production: boolean;
  environmentName: string;
  clientId: string;
  tenantId: string;
  scope: string;
  apiUrl: string;
  redirectUri: string;
  logoutUri: string;
  blobUrl: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
}

export interface UserInfo {
  id: string;
  displayName: string;
  mail: string;
  userPrincipalName: string;
  jobTitle?: string;
  department?: string;
  mobilePhone?: string;
  businessPhones?: string[];
}

export interface AuthResult {
  success: boolean;
  error?: string;
  tokens?: AuthTokens;
  userInfo?: UserInfo;
}

export interface AuthContextType {
  isAuthenticated: boolean;
  loading: boolean;
  userInfo: UserInfo | null;
  login: () => Promise<AuthResult>;
  logout: () => Promise<AuthResult>;
  checkAuthStatus: () => Promise<void>;
}
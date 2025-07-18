import { Environment } from '../types/auth.types';

export const environment: Record<string, Environment> = {
  development: {
    production: false,
    environmentName: 'development',
    clientId: '251c9255-06eb-4d4e-a34e-17cba8f98b6d',
    tenantId: '734e360f-9a39-4178-8e90-cb94d8c322ed',
    scope: 'api://251c9255-06eb-4d4e-a34e-17cba8f98b6d/access_as_user',
    apiUrl: 'https://afc-backend-02.azurewebsites.net/api/v1/',
    redirectUri: 'msauthapp://auth',
    logoutUri: 'msauthapp://logout',
    blobUrl: 'https://afcdevst.blob.core.windows.net/container',
  },
  qa: {
    production: false,
    environmentName: 'qa',
    clientId: '251c9255-06eb-4d4e-a34e-17cba8f98b6d',
    tenantId: '734e360f-9a39-4178-8e90-cb94d8c322ed',
    scope: 'api://251c9255-06eb-4d4e-a34e-17cba8f98b6d/access_as_user',
    apiUrl: 'https://afc-frontdoor-endpoint-f5e5f8a7c4dud4cv.a02.azurefd.net/api/v1/',
    redirectUri: 'msauthapp://auth',
    logoutUri: 'msauthapp://logout',
    blobUrl: 'https://afcdevteststorageaccount.blob.core.windows.net/container',
  }
};

export const currentEnvironment: Environment = environment.development;
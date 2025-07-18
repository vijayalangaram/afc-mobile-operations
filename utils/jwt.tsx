import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
  name?: string;
  email?: string;
  preferred_username?: string;
  jobTitle?: string;
  [key: string]: any;
}

export const decodeIdToken = (idToken: string): DecodedToken => {
  try {
    return jwtDecode<DecodedToken>(idToken);
  } catch (e) {
    console.error('Invalid ID token', e);
    return {};
  }
};

import { Platform } from 'react-native';

export const DEFAULT_API_URL = Platform.select({
  android: 'http://10.0.2.2:4000/api/v1',
  ios: 'http://localhost:4000/api/v1',
  default: 'http://localhost:4000/api/v1',
});

export const DEFAULT_WS_URL = Platform.select({
  android: 'http://10.0.2.2:4001',
  ios: 'http://localhost:4001',
  default: 'http://localhost:4001',
});

export const STORAGE_KEYS = {
  TOKEN: '@orderrestro_token',
  USER: '@orderrestro_user',
  BRANCH_ID: '@orderrestro_branch_id',
  SERVER_URL: '@orderrestro_server_url',
};

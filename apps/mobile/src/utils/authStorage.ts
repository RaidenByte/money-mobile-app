import { Platform } from 'react-native';

type FileSystemModule = typeof import('expo-file-system/legacy');

const TOKEN_KEY = 'money_mobile_auth_token';
const TOKEN_FILE = 'money_mobile_auth_token.txt';

let memoryToken: string | null = null;

const loadFileSystem = (): FileSystemModule | null => {
  try {
    return require('expo-file-system/legacy') as FileSystemModule;
  } catch {
    return null;
  }
};

const getTokenFileUri = (FileSystem: FileSystemModule) => {
  if (!FileSystem.documentDirectory) return null;
  return `${FileSystem.documentDirectory}${TOKEN_FILE}`;
};

export const readAuthToken = async () => {
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    const token = localStorage.getItem(TOKEN_KEY);
    memoryToken = token;
    return token;
  }

  const FileSystem = loadFileSystem();
  if (!FileSystem) return memoryToken;

  const fileUri = getTokenFileUri(FileSystem);
  if (!fileUri) return memoryToken;

  try {
    const token = await FileSystem.readAsStringAsync(fileUri);
    memoryToken = token.trim() || null;
    return memoryToken;
  } catch {
    return memoryToken;
  }
};

export const writeAuthToken = async (token: string) => {
  memoryToken = token;

  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token);
    return;
  }

  const FileSystem = loadFileSystem();
  if (!FileSystem) return;

  const fileUri = getTokenFileUri(FileSystem);
  if (!fileUri) return;

  try {
    await FileSystem.writeAsStringAsync(fileUri, token, {
      encoding: FileSystem.EncodingType.UTF8,
    });
  } catch {
    // Ignore storage write failures to avoid blocking login flow.
  }
};

export const clearAuthToken = async () => {
  memoryToken = null;

  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
    return;
  }

  const FileSystem = loadFileSystem();
  if (!FileSystem) return;

  const fileUri = getTokenFileUri(FileSystem);
  if (!fileUri) return;

  try {
    const info = await FileSystem.getInfoAsync(fileUri);
    if (info.exists) {
      await FileSystem.deleteAsync(fileUri, { idempotent: true });
    }
  } catch {
    // Ignore storage delete failures to avoid blocking logout flow.
  }
};

export interface StorageData {
  recentFiles: Array<{
    name: string;
    content: string;
    lastModified: number;
  }>;
  lastUsedSettings: {
    paperSize: string;
    margins: string;
    includeToC: boolean;
    pageNumbers: boolean;
    metadata?: {
      title?: string;
      author?: string;
      subject?: string;
      keywords?: string[];
    };
    mathEnabled: boolean;
  };
  currentFile?: {
    name: string;
    content: string;
    lastModified: number;
  };
}

const STORAGE_KEY = 'markdown-pdf-settings';

const defaultSettings: StorageData = {
  recentFiles: [],
  lastUsedSettings: {
    paperSize: 'a4',
    margins: 'normal',
    includeToC: false,
    pageNumbers: false,
    mathEnabled: false
  }
};

function isStorageAvailable() {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
}

export function getStorageData(): StorageData {
  if (!isStorageAvailable()) {
    console.warn('localStorage is not available, using default settings');
    return defaultSettings;
  }

  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return defaultSettings;

    const parsed = JSON.parse(data);
    return {
      ...defaultSettings,
      ...parsed
    };
  } catch (error) {
    console.error('Failed to load settings:', error);
    return defaultSettings;
  }
}

export function saveStorageData(data: Partial<StorageData>) {
  if (!isStorageAvailable()) {
    console.warn('localStorage is not available, settings will not persist');
    return;
  }

  try {
    const currentData = getStorageData();
    const newData = { ...currentData, ...data };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
}

export function addRecentFile(name: string, content: string) {
  const data = getStorageData();
  const newFile = {
    name,
    content,
    lastModified: Date.now()
  };

  // Remove existing entry with same name if exists
  data.recentFiles = data.recentFiles.filter(file => file.name !== name);
  
  // Add new file to start of array
  data.recentFiles.unshift(newFile);
  
  // Keep only last 5 files
  data.recentFiles = data.recentFiles.slice(0, 5);
  
  saveStorageData({ recentFiles: data.recentFiles });
}

export function updateCurrentFile(name: string, content: string) {
  const currentFile = {
    name,
    content,
    lastModified: Date.now()
  };
  saveStorageData({ currentFile });
}

export function updateSettings(settings: Partial<StorageData['lastUsedSettings']>) {
  const data = getStorageData();
  const newSettings = { ...data.lastUsedSettings, ...settings };
  saveStorageData({ lastUsedSettings: newSettings });
}

export function clearStorage() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear settings:', error);
  }
}

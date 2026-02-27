function getStorage(): Storage | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function safeGetStorageItem(key: string): string | null {
  const storage = getStorage();
  if (!storage) {
    return null;
  }

  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

export function safeSetStorageItem(key: string, value: string): boolean {
  const storage = getStorage();
  if (!storage) {
    return false;
  }

  try {
    storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

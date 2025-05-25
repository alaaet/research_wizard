// Utility for IPC communication with Electron main process for user meta data

type UserMetaData = {
  Key: string;
  Value: string;
  Type: string;
  label: string;
};

export async function getAllUserMetaData(): Promise<UserMetaData[]> {
  console.log('[getAllUserMetaData] Invoking userMetaData:getAll');
  try {
    const result = await window.electron?.invoke('userMetaData:getAll');
    console.log('[getAllUserMetaData] Result:', result);
    return result;
  } catch (err) {
    console.log('[getAllUserMetaData] Error:', err);
    throw err;
  }
}

export async function getUserMetaData(key: string): Promise<UserMetaData | null> {
  console.log('[getUserMetaData] Invoking userMetaData:get with key:', key);
  try {
    const result = await window.electron?.invoke('userMetaData:get', key);
    console.log('[getUserMetaData] Result:', result);
    return result;
  } catch (err) {
    console.log('[getUserMetaData] Error:', err);
    throw err;
  }
}

export async function setUserMetaData(key: string, value: string, type: string): Promise<{ success: boolean; error?: string }> {
  console.log('[setUserMetaData] Invoking userMetaData:set with', { key, value, type });
  try {
    const result = await window.electron?.invoke('userMetaData:set', { key, value, type });
    console.log('[setUserMetaData] Result:', result);
    return result;
  } catch (err) {
    console.log('[setUserMetaData] Error:', err);
    throw err;
  }
}

export async function getUserMetaDataByRef(ref: string): Promise<UserMetaData[]> {
  return await window.electron?.invoke('userMetaData:getByRef', ref);
}


export type { UserMetaData }; 
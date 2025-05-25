import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getUserMetaData, setUserMetaData } from '../connectors/userMetaDataIpc';

interface UserMetaDataContextType {
  name: string;
  email: string;
  research_language: string;
  refresh: () => Promise<void>;
  setMeta: (key: string, value: string) => Promise<void>;
}

const UserMetaDataContext = createContext<UserMetaDataContextType | undefined>(undefined);

export const UserMetaDataProvider = ({ children }: { children: ReactNode }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [research_language, setResearchLanguage] = useState('');

  const fetchMeta = async () => {
    const [nameMeta, emailMeta, langMeta] = await Promise.all([
      getUserMetaData('name'),
      getUserMetaData('email'),
      getUserMetaData('research_language'),
    ]);
    setName(nameMeta?.Value || '');
    setEmail(emailMeta?.Value || '');
    setResearchLanguage(langMeta?.Value || '');
  };

  useEffect(() => {
    fetchMeta();
  }, []);

  const refresh = fetchMeta;

  const setMeta = async (key: string, value: string) => {
    await setUserMetaData(key, value, 'string');
    await fetchMeta();
  };

  return (
    <UserMetaDataContext.Provider value={{ name, email, research_language, refresh, setMeta }}>
      {children}
    </UserMetaDataContext.Provider>
  );
};

export const useUserMetaData = () => {
  const ctx = useContext(UserMetaDataContext);
  if (!ctx) throw new Error('useUserMetaData must be used within a UserMetaDataProvider');
  return ctx;
}; 
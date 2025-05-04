import React, { useEffect, useState } from 'react';
import { getUserMetaDataByRef, setUserMetaData, type UserMetaData } from '../../utils/userMetaDataIpc';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';

export default function ResearchTab() {
  const [fields, setFields] = useState<UserMetaData[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [successKey, setSuccessKey] = useState<string | null>(null);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getUserMetaDataByRef('res').then((data) => {
      setFields(data || []);
      setEditValues(Object.fromEntries((data || []).map(f => [f.Key, f.Value])));
      setLoading(false);
    });
  }, []);

  const handleChange = (key: string, value: string) => {
    setEditValues(v => ({ ...v, [key]: value }));
  };

  const handleSave = async (field: UserMetaData) => {
    setSavingKey(field.Key);
    setSuccessKey(null);
    setErrorKey(null);
    try {
      await setUserMetaData(field.Key, editValues[field.Key], field.Type);
      setSuccessKey(field.Key);
      setTimeout(() => setSuccessKey(null), 2000);
    } catch (err) {
      setErrorKey(field.Key);
    }
    setSavingKey(null);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      {fields.map(field => (
        <div key={field.Key} className="space-y-1">
          <label className="block font-medium">{field.label}</label>
          {field.Type === 'string' || field.Type === 'number' ? (
            <Input
              value={editValues[field.Key] ?? ''}
              onChange={e => handleChange(field.Key, e.target.value)}
              type={field.Type === 'number' ? 'number' : 'text'}
            />
          ) : (
            <textarea
              className="w-full border rounded px-3 py-2 bg-background"
              value={editValues[field.Key] ?? ''}
              onChange={e => handleChange(field.Key, e.target.value)}
              rows={3}
            />
          )}
          <Button
            className="mt-2"
            size="sm"
            onClick={() => handleSave(field)}
            disabled={savingKey === field.Key}
          >
            {savingKey === field.Key ? 'Saving...' : 'Save'}
          </Button>
          {successKey === field.Key && <span className="text-green-600 ml-2">Saved!</span>}
          {errorKey === field.Key && <span className="text-red-500 ml-2">Error!</span>}
        </div>
      ))}
    </div>
  );
} 
import React, { useEffect, useState } from 'react';
import { getUserMetaDataByRef, setUserMetaData, type UserMetaData } from '../../utils/userMetaDataIpc';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';

export default function ResearchTab() {
  const [fields, setFields] = useState<UserMetaData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);

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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError(false);
    try {
      for (const field of fields) {
        await setUserMetaData(field.Key, editValues[field.Key], field.Type);
      }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      setError(true);
    }
    setSaving(false);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
        </div>
      ))}
      <Button type="submit" className="mt-4" size="sm" disabled={saving}>
        {saving ? 'Saving...' : 'Save All'}
      </Button>
      {success && <span className="text-green-600 ml-2">Saved!</span>}
      {error && <span className="text-red-500 ml-2">Error!</span>}
    </form>
  );
} 
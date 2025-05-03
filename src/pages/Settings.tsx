import React, { useEffect, useState } from 'react';
import { getUserMetaData, setUserMetaData } from '../utils/userMetaDataIpc';
import PageLayout from '../components/layout/PageLayout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { motion } from 'framer-motion';

const UN_LANGUAGES = [
  { value: 'ar', label: 'Arabic' },
  { value: 'zh', label: 'Chinese' },
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'French' },
  { value: 'ru', label: 'Russian' },
  { value: 'es', label: 'Spanish' },
];

const FIELDS = [
  { key: 'name', label: 'Name', type: 'string' },
  { key: 'email', label: 'Email', type: 'string' },
  { key: 'research_language', label: 'Research Language', type: 'string' },
];

export default function SettingsPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    research_language: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all(FIELDS.map(f => getUserMetaData(f.key)))
      .then(results => {
        setForm({
          name: results[0]?.Value || '',
          email: results[1]?.Value || '',
          research_language: results[2]?.Value || '',
        });
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to load settings.');
        setLoading(false);
      });
  }, []);

  const handleChange = (key: string, value: string) => {
    setForm(f => ({ ...f, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      for (const field of FIELDS) {
        await setUserMetaData(field.key, form[field.key as keyof typeof form], field.type);
      }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      setError('Failed to save settings.');
    }
    setSaving(false);
  };

  return (
    <PageLayout>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="p-6 animate-enter max-w-xl mx-auto"
      >
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Settings</h1>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block font-medium mb-1">Name</label>
              <Input
                value={form.name}
                onChange={e => handleChange('name', e.target.value)}
                type="text"
                autoComplete="off"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Email</label>
              <Input
                value={form.email}
                onChange={e => handleChange('email', e.target.value)}
                type="email"
                autoComplete="off"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Research Language</label>
              <select
                className="w-full border rounded px-3 py-2 bg-background"
                value={form.research_language}
                onChange={e => handleChange('research_language', e.target.value)}
                required
              >
                <option value="" disabled>Select language...</option>
                {UN_LANGUAGES.map(lang => (
                  <option key={lang.value} value={lang.value}>{lang.label}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Settings'}</Button>
              {success && <span className="text-green-600 self-center">Saved!</span>}
              {error && <span className="text-red-500 self-center">{error}</span>}
            </div>
          </form>
        )}
      </motion.div>
    </PageLayout>
  );
} 
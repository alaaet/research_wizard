import React, { useEffect, useState } from 'react';
import { getUserMetaData, setUserMetaData } from '../../connectors/userMetaDataIpc';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useUserMetaData } from '../../context/UserMetaDataContext';
import LanguageSelector from '@/components/LanguageSelector';
import { useTranslation } from 'react-i18next';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import supportedLanguages from '../../../backend/default_settings/supported_languages.json';

const FIELDS = [
  { key: 'name', label: 'Name', type: 'string' },
  { key: 'email', label: 'Email', type: 'string' },
  { key: 'research_language', label: 'Research Language', type: 'string' },
  { key: 'ui_language', label: 'UI Language', type: 'string' },
];

export default function GeneralTab({ dir = 'ltr' }: { dir?: 'ltr' | 'rtl' }) {
  const { t, i18n } = useTranslation();
  const [form, setForm] = useState({
    name: '',
    email: '',
    research_language: '',
    ui_language: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { refresh } = useUserMetaData();

  useEffect(() => {
    setLoading(true);
    Promise.all(FIELDS.map(f => getUserMetaData(f.key)))
      .then(results => {
        setForm({
          name: results[0]?.Value || '',
          email: results[1]?.Value || '',
          research_language: results[2]?.Value || '',
          ui_language: results[3]?.Value || 'en',
        });
        // Set the UI language if it's saved in the database
        if (results[3]?.Value) {
          i18n.changeLanguage(results[3].Value);
        }
        setLoading(false);
      })
      .catch(err => {
        setError(t('settings.general.error.loadFailed'));
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
      refresh();
    } catch (err) {
      setError(t('settings.general.error.saveFailed'));
    }
    setSaving(false);
  };

  if (loading) return <div>{t('common.loading')}</div>;

  return (
    <form className={`space-y-6`} onSubmit={handleSubmit} dir={dir}>
      <div>
        <label className={`block font-medium mb-1 ${dir === 'rtl' ? 'text-right' : ''}`}>{t('common.name')}</label>
        <Input
          value={form.name}
          onChange={e => handleChange('name', e.target.value)}
          type="text"
          autoComplete="off"
          className={dir === 'rtl' ? 'text-right' : ''}
        />
      </div>
      <div>
        <label className={`block font-medium mb-1 ${dir === 'rtl' ? 'text-right' : ''}`}>{t('common.email')}</label>
        <Input
          value={form.email}
          onChange={e => handleChange('email', e.target.value)}
          type="email"
          autoComplete="off"
          className={dir === 'rtl' ? 'text-right' : ''}
        />
      </div>
      <div>
        <label className={`block font-medium mb-1 ${dir === 'rtl' ? 'text-right' : ''}`}>{t('settings.language.reportLanguage')}</label>
        <Select
          value={form.research_language}
          onValueChange={(value) => handleChange('research_language', value)}
        >
          <SelectTrigger className={dir === 'rtl' ? 'text-right' : ''}>
            <SelectValue placeholder={t('common.select')} />
          </SelectTrigger>
          <SelectContent>
            {supportedLanguages.languages.map(lang => (
              <SelectItem key={lang.code} value={lang.name}>{lang.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <LanguageSelector 
          value={form.ui_language}
          onChange={(value) => {
            handleChange('ui_language', value);
            i18n.changeLanguage(value);
          }}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={saving}>
          {saving ? t('common.saving') : t('common.save')}
        </Button>
        {success && <span className="text-green-600 self-center">{t('common.saved')}</span>}
        {error && <span className="text-red-500 self-center">{error}</span>}
      </div>
    </form>
  );
} 
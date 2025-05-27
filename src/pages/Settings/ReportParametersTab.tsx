import React, { useEffect, useState } from 'react';
import { getUserMetaDataByRef, setUserMetaData, type UserMetaData } from '../../connectors/userMetaDataIpc';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Separator } from "@/components/ui/separator";
import { useTranslation } from 'react-i18next';

export default function ReportParametersTab({ dir = 'ltr' }: { dir?: 'ltr' | 'rtl' }) {
  const { t } = useTranslation();
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

  if (loading) return <div>{t('common.loading')}</div>;

  return (
    <>
      <h2 className={`text-xl font-bold mb-2 ${dir === 'rtl' ? 'text-right' : ''}`}>{t('settings.reportParameters.title')}</h2>
      <p className={`text-muted-foreground mb-6 ${dir === 'rtl' ? 'text-right' : ''}`}>{t('settings.reportParameters.description')}</p>
      <Separator className="mb-6" />
      <form onSubmit={handleSubmit} className="space-y-4" dir={dir}>
        {fields.map(field => (
          <div key={field.Key} className="flex items-center gap-4">
            <label
              htmlFor={field.Key}
              className={`block font-medium min-w-[220px] ${dir === 'rtl' ? 'text-right' : 'text-left'}`}
            >
              {field.label}
            </label>
            {field.Type === 'string' || field.Type === 'number' ? (
              <Input
                id={field.Key}
                value={editValues[field.Key] ?? ''}
                onChange={e => handleChange(field.Key, e.target.value)}
                type={field.Type === 'number' ? 'number' : 'text'}
                className={`flex-1 ${dir === 'rtl' ? 'text-right' : ''}`}
              />
            ) : (
              <textarea
                id={field.Key}
                className={`w-full border rounded px-3 py-2 bg-background flex-1 ${dir === 'rtl' ? 'text-right' : ''}`}
                value={editValues[field.Key] ?? ''}
                onChange={e => handleChange(field.Key, e.target.value)}
                rows={3}
              />
            )}
          </div>
        ))}
        <div className="flex justify-end">
          <Button type="submit" className="mt-4" size="sm" disabled={saving}>
            {saving ? t('common.saving') : t('common.save')}
          </Button>
        </div>
        {success && <span className="text-green-600 ml-2">{t('common.saved')}</span>}
        {error && <span className="text-red-500 ml-2">{t('common.error')}</span>}
      </form>
    </>
  );
} 
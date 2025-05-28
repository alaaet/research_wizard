import React, { useEffect, useState } from 'react';
import type { SearchRetriever } from '../../../shared/searchRetrieverTypes';
import { getSearchRetrievers, updateSearchRetriever } from '../../connectors/integrationsIpc';
import { Card } from '../../components/ui/card';
import { Check } from 'lucide-react';
import { useIsDarkTheme } from '@/hooks/useIsDarkTheme';
import { Label } from '@/components/ui/label';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import EditRetrieverModal from '../../components/modals/EditRetrieverModal';
import { useTranslation } from 'react-i18next';

export default function IntegrationsTab({ dir = 'ltr' }: { dir?: 'ltr' | 'rtl' }) {
  const [retrievers, setRetrievers] = useState<SearchRetriever[]>([]);
  const [loading, setLoading] = useState(true);
  const [editRetriever, setEditRetriever] = useState<SearchRetriever | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const isDark = useIsDarkTheme();
  const { t } = useTranslation();

  useEffect(() => {
    getSearchRetrievers().then(data => {
      setRetrievers(data || []);
      setLoading(false);
    });
  }, []);

  return (
    <>
      <Label className={`text-lg font-bold text-center mb-4 w-full ${dir === 'rtl' ? 'text-right' : ''}`}>{t('settings.integrations.retrieverTitle')}</Label>
      {loading ? (
        <div>{t('settings.integrations.loadingRetrievers')}</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {retrievers.map(retriever => {
            const iconUrl = `../assets/integrations/retrievers/${retriever.icon}`;
            return (
              <Card
                key={retriever.slug}
                className="relative aspect-square flex flex-col items-center justify-between p-4 cursor-pointer bg-rwiz-secondary hover:bg-rwiz-secondary-light"
                onClick={() => { setEditRetriever(retriever); setEditOpen(true); }}
              >
                <div className="w-full flex items-center justify-between mb-2">
                  <span className="font-bold text-lg capitalize">{retriever.slug}</span>
                  {retriever.is_active && (
                    <Check className="text-green-500 w-6 h-6 absolute top-2 right-2 rounded-full shadow bg-white" size={30} strokeWidth={4}/>
                  )}
                </div>
                <div className="flex-1 flex items-center justify-center w-full">
                  <img
                    src={iconUrl + (isDark? '-light.png' :'-dark.png')}
                    className="w-20 h-20 object-contain mx-auto"
                    alt={retriever.slug}
                    style={{ maxHeight: '60%' }}
                  />
                </div>
                {retriever.recommendation && (
                  <div className="text-sm text-center text-gray-500 mt-2">
                    {retriever.recommendation}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
      <EditRetrieverModal
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) setEditRetriever(null);
          if (!open) getSearchRetrievers().then(data => setRetrievers(data || []));
        }}
        editRetriever={editRetriever}
        setEditRetriever={setEditRetriever}
        setRetrievers={setRetrievers}
      />
    </>
  );
} 
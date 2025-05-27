import { useTranslation } from 'react-i18next';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { changeLanguage } from '@/lib/i18n';

interface LanguageSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'ar', name: 'العربية' },
  { code: 'zh', name: '中文' },
  { code: 'fr', name: 'Français' },
  { code: 'ru', name: 'Русский' },
  { code: 'es', name: 'Español' }
];

const LanguageSelector = ({ value, onChange }: LanguageSelectorProps) => {
  const { t } = useTranslation();

  const handleLanguageChange = (newValue: string) => {
    changeLanguage(newValue);
    onChange(newValue);
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <label className="font-medium">{t('settings.language.uiLanguage')}</label>
      <Select value={value} onValueChange={handleLanguageChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={t('settings.language.uiLanguage')} />
        </SelectTrigger>
        <SelectContent>
          {LANGUAGES.map(lang => (
            <SelectItem key={lang.code} value={lang.code}>
              {lang.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default LanguageSelector; 
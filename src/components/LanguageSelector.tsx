import { useTranslation } from 'react-i18next';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { changeLanguage } from '@/lib/i18n';
import supportedLanguages from '../../backend/default_settings/supported_languages.json';

interface LanguageSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

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
          {supportedLanguages.languages.map(lang => (
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
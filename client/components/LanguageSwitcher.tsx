import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/lib/i18n';
import { Languages, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LanguageSwitcherProps {
  variant?: 'button' | 'badge' | 'minimal';
  className?: string;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ 
  variant = 'button', 
  className 
}) => {
  const { currentLanguage, setLanguage } = useTranslation();

  const languages = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' }
  ];

  const currentLang = languages.find(lang => lang.code === currentLanguage);
  const otherLang = languages.find(lang => lang.code !== currentLanguage);

  const handleLanguageChange = () => {
    if (otherLang) {
      setLanguage(otherLang.code as 'en' | 'hi');
    }
  };

  if (variant === 'badge') {
    return (
      <Badge 
        variant="outline" 
        className={cn(
          "cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors",
          className
        )}
        onClick={handleLanguageChange}
      >
        <Globe className="h-3 w-3 mr-1" />
        {currentLang?.nativeName}
      </Badge>
    );
  }

  if (variant === 'minimal') {
    return (
      <button
        onClick={handleLanguageChange}
        className={cn(
          "flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors",
          className
        )}
        title={`Switch to ${otherLang?.name}`}
      >
        <Languages className="h-4 w-4" />
        <span className="font-medium">{currentLang?.code.toUpperCase()}</span>
      </button>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleLanguageChange}
      className={cn("flex items-center gap-2", className)}
      title={`Switch to ${otherLang?.name}`}
    >
      <Globe className="h-4 w-4" />
      <span>{currentLang?.nativeName}</span>
    </Button>
  );
};

export default LanguageSwitcher;

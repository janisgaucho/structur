'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Globe, Check } from 'lucide-react';
import { setLocale } from '@/actions/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const LANGUAGES = [
  { code: 'fr', label: 'Français' },
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'ur', label: 'اردو' },
];

export function LanguageSwitcher() {
  const router = useRouter();
  const [currentLocale, setCurrentLocale] = useState<string>('fr');

  // Au chargement, on lit le cookie pour trouver la langue active
  useEffect(() => {
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return 'fr'; // Français par défaut
    };
    setCurrentLocale(getCookie('NEXT_LOCALE') || 'fr');
  }, []);

  const handleSelect = async (code: string) => {
    setCurrentLocale(code); // Mise à jour visuelle immédiate
    await setLocale(code);  // Action serveur
    router.refresh();       // Rechargement des données
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 outline-none cursor-pointer">
        <Globe className="w-5 h-5" />
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="bg-white rounded-xl shadow-lg border p-1 min-w-35">
        {LANGUAGES.map((lang) => (
          <DropdownMenuItem key={lang.code} onClick={() => handleSelect(lang.code)}
            className={`flex items-center justify-between cursor-pointer ${
              currentLocale === lang.code ? 'font-medium text-black' : 'text-gray-600'
            }`}
          >
            {lang.label}
            {currentLocale === lang.code && (
              <Check className="w-4 h-4 text-blue-600"/>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
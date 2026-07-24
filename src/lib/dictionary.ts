import 'server-only';
import { cookies } from 'next/headers';

const dictionaries = {
  fr: () => import('@/dictionaries/fr.json').then((module) => module.default),
  en: () => import('@/dictionaries/en.json').then((module) => module.default),
  es: () => import('@/dictionaries/es.json').then((module) => module.default),
  ur: () => import('@/dictionaries/ur.json').then((module) => module.default),
};

export async function getDictionary() {
  const cookieStore = await cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'fr';
  
  if (dictionaries[locale as keyof typeof dictionaries]) {
    return dictionaries[locale as keyof typeof dictionaries]();
  }
  return dictionaries.fr();
}

export type Dictionary = Awaited<ReturnType<typeof getDictionary>>;
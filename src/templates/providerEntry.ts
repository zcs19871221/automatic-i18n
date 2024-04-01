const providerTemplate = (locales: string[]) => `
import {
  ReactNode,
  useState,
  createContext,
  useContext,
  useMemo,
  useLayoutEffect,
} from 'react';
import { IntlProvider } from 'react-intl';

import { TranslateKey, AvailableLocale, LocaleContextValue } from './types.ts';

export function importMessages(
  locale: AvailableLocale = 
): Promise<Record<TranslateKey, string>> {
  switch (locale) {
    ${locales
      .map((locale) => {
        return `case '${locale}':
              return import('./${locale}.ts') as unknown as Promise<
                Record<TranslateKey, string>
              >; `;
      })
      .join('\n')}
    default:
      const error: never = locale;
      throw new Error(error);
  }
}


const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext);

  if (context === undefined) {
    throw new Error('useLocale must be used within the LocaleProvider context');
  }

  return context;
}

export function LocaleProvider({
  children,
  defaultLocale,
  defaultMessages,
}: {
  defaultLocale: AvailableLocale;
  children: ReactNode;
  defaultMessages?: Readonly<Record<string, string>>;
}) {
  const [messages, setMessages] = useState(defaultMessages);
  const [locale, setLocale] = useState(defaultLocale);

  useLayoutEffect(() => {
    let cancelled = false;

    async function fetchMessages() {
      const importedMessages = await importMessages(locale);
      if (!cancelled) {
        setMessages(importedMessages);
        document.documentElement.lang = locale;
      }
    }

    fetchMessages();

    return () => {
      cancelled = true;
    };
  }, [locale]);

  const value = useMemo(
    (): LocaleContextValue => ({
      locale,
      setLocale,
      fetchingMessages: !messages,
    }),
    [locale, messages],
  );


  return (
    <LocaleContext.Provider value={value}>
      <IntlProvider locale={locale} messages={messages}>
        {children}
      </IntlProvider>
    </LocaleContext.Provider>
  );
}
`;

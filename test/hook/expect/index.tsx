import React, {
  ReactNode,
  useState,
  createContext,
  useContext,
  useMemo,
  useLayoutEffect,
} from 'react';
import { IntlProvider } from 'react-intl';

import type { AvailableLocale, LocaleContextValue, LocalKey } from './types.ts';

export function importMessages(
  locale: AvailableLocale
): Promise<Record<LocalKey, string>> {
  switch (locale) {
    case 'zh-cn':
      return import('./zh-cn.ts') as unknown as Promise<
        Record<LocalKey, string>
      >;
    case 'en-us':
      return import('./en-us.ts') as unknown as Promise<
        Record<LocalKey, string>
      >;
    default: {
      const error: never = locale;
      throw new Error(error);
    }
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
    [locale, messages]
  );

  return (
    <LocaleContext.Provider value={value}>
      <IntlProvider locale={locale} messages={messages}>
        {children}
      </IntlProvider>
    </LocaleContext.Provider>
  );
}

export default function defaultEntry(
  localeFiles: string[],
  defaultLocale: string
) {
  return `
import React, {
  ReactNode,
  useState,
  createContext,
  useContext,
  useMemo,
  useLayoutEffect,
} from 'react';
import {
  IntlProvider,
  IntlShape,
  createIntl,
  createIntlCache,
  IntlCache,
} from 'react-intl';

import type { AvailableLocales, LocalKey } from './types';

export interface LocaleContextValue {
  readonly locale: AvailableLocales;
  readonly setLocale: React.Dispatch<React.SetStateAction<AvailableLocales>>;
}

export async function importMessages(
  locale: AvailableLocales,
): Promise<Record<LocalKey, string>> {
  switch (locale) {
    ${localeFiles
      .map(
        (name) => `
        case '${name}':
          return (await import('./${name}.ts')).default;
    `
      )
      .join('')}
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

class I18n {
  public get locale() {
    return this.currentLocale;
  }

  public get intl(): IntlShape {
    return this.currentIntl;
  }

  public get messages(): Record<LocalKey, string> | null {
    return this.currentMessages;
  }

  public update(locale: AvailableLocales, messages: Record<LocalKey, string>) {
    this.currentIntl = createIntl(
      {
        locale,
        messages,
      },
      this.cache,
    );
    this.currentLocale = locale;
    this.currentMessages = messages;
  }

  private currentLocale: AvailableLocales | null = null;

  private cache: IntlCache = createIntlCache();

  private currentIntl: IntlShape = createIntl(
    {
      locale: '${defaultLocale}',
      messages: {} as unknown as Record<LocalKey, string>,
    },
    this.cache,
  );

  private currentMessages: Record<LocalKey, string> | null = null;
}

export const i18n = new I18n();

export function LocaleProvider({
  children,
  fallback,
  defaultLocale,
}: {
  defaultLocale: AvailableLocales;
  children: ReactNode;
  fallback?: React.ReactNode;
}) {
  const [messages, setMessages] = useState<Record<string, string> | null>(null);
  const [locale, setLocale] = useState(defaultLocale);

  useLayoutEffect(() => {
    async function fetchMessages() {
      const fetchedMessages = await importMessages(locale);
      i18n.update(locale, fetchedMessages);
      setMessages(fetchedMessages);
      document.documentElement.lang = locale;
    }

    fetchMessages();
  }, [locale]);

  const value = useMemo(
    (): LocaleContextValue => ({
      locale,
      setLocale,
    }),
    [locale],
  );

  return (
    <LocaleContext.Provider value={value}>
      {messages ? (
        <IntlProvider locale={locale} messages={messages}>
          {children}
        </IntlProvider>
      ) : (
        fallback
      )}
    </LocaleContext.Provider>
  );
}

`;
}

export default function CreateHookEntry(localeFiles: string[]) {
  return `
    import React, {
        ReactNode,
        useState,
        createContext,
        useContext,
        useMemo,
        useLayoutEffect,
    } from 'react';
    import { IntlProvider } from 'react-intl';

    import type { AvailableLocale, LocalKey } from './types.ts';

    export interface LocaleContextValue {
        readonly fetching: boolean;
        readonly locale: AvailableLocale;
        readonly setLocale: React.Dispatch<React.SetStateAction<AvailableLocale>>;
        readonly fetchingMessages: boolean;
    }

    interface LocaleFile {
        default: Record<LocalKey, string>;
    }

    export function importMessages(locale: AvailableLocale): Promise<LocaleFile> {
        switch (locale) {
          ${localeFiles
            .map(
              (name) => `
            case '${name}':
              return import('./${name}.ts') as unknown as Promise<LocaleFile>;`
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
        const [fetching, setFetching] = useState(false);

        useLayoutEffect(() => {
            let cancelled = false;

            async function fetchMessages() {
                setFetching(true);
                const importedMessages = await importMessages(locale);
                if (!cancelled) {
                    setMessages(importedMessages.default);
                    setFetching(false);
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
                fetching,
                fetchingMessages: !messages,
            }),
            [locale, messages, fetching],
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
}

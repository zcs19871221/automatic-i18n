export type AvailableLocale = 'zh-cn' | 'en-us';

export interface LocaleContextValue {
  readonly locale: AvailableLocale;
  readonly setLocale: React.Dispatch<React.SetStateAction<AvailableLocale>>;
  readonly fetchingMessages: boolean;
}

export type LocalKey = any;

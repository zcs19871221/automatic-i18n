export type AvailableLocales = 'zh-cn' | 'en-us';

export interface LocaleContextValue {
  readonly locale: AvailableLocales;
  readonly setLocale: React.Dispatch<React.SetStateAction<AvailableLocales>>;
  readonly fetchingMessages: boolean;
}

export type LocalKey = 'key0005' | 'key0006' | 'key0008' | 'key0009';

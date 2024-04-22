export type AvailableLocale = 'en-us' | 'zh-cn';

export interface LocaleContextValue {
  readonly locale: AvailableLocale;
  readonly setLocale: React.Dispatch<React.SetStateAction<AvailableLocale>>;
  readonly fetchingMessages: boolean;
}

export type LocalKey = 'key0001' | 'key0002' | 'key0003' | 'key0004';

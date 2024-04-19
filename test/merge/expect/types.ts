export type AvailableLocale = 'zh-cn' | 'en-us';

export interface LocaleContextValue {
  readonly locale: AvailableLocale;
  readonly setLocale: React.Dispatch<React.SetStateAction<AvailableLocale>>;
  readonly fetchingMessages: boolean;
}

export type LocalKey =
  | 'key0002'
  | 'key0005'
  | 'key0006'
  | 'key0008'
  | 'key0009';

import { TEXT_KEYS } from './textKeyType';
import { localeTypes } from './localeTypes';

export type Locales = Record<TEXT_KEYS, string>;

class I18n {
  public locales: Locales;

  private currentLocale: localeTypes | null = null;

  public async switch(locale: localeTypes) {
    if (this.currentLocale === locale) {
      return;
    }
    const json = await import('./' + locale + '.json');
    if (json) {
      this.locales = json;
    }
  }
}

export const i18n = new I18n();

export const Locales = i18n.locales;

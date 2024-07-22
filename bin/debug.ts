import I18nReplacer from '../src/';

I18nReplacer.createI18nReplacer({
  targets: ['C:\\work\\eh-ui'],
  distLocaleDir: 'C:\\work\\eh-ui\\i18n',
  I18nFormatterClassAlias: 'global',
}).replace();

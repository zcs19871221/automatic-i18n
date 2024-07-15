#!/usr/bin/env node
import * as path from 'path';
import I18nReplacer, { GlobalI18nFormatter } from '../src';

const root = path.join(__dirname, '../../../poc4c-ui/Poc4c-UI');

I18nReplacer.createI18nReplacer({
  distLocaleDir: path.join(root, 'i18n'),
  I18nFormatterClass: GlobalI18nFormatter,
  targets: [path.join(root, 'modules')],
  debug: true,
})
  .replace()
  .then(() => {
    console.log('finish');
  });

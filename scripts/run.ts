#!/usr/bin/env node
import * as path from 'path';
import * as fs from 'fs';
import I18nReplacer, { GlobalI18nFormatter } from '../src';

const root = path.join(__dirname, '../../Poc4c-UI');
let dirsToReplace = ['modules', 'pages', 'utils'];
if (process.argv.slice(2).length > 0) {
  dirsToReplace = process.argv.slice(2);
}
I18nReplacer.createI18nReplacer({
  distLocaleDir: root,
  I18nFormatterClass: GlobalI18nFormatter,
  targets: dirsToReplace
    .map((f) => path.join(root, f))
    .filter((f) => {
      return fs.lstatSync(f).isDirectory();
    }),
}).replace();

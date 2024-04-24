#!/usr/bin/env node
import * as path from 'path';
import * as fs from 'fs';
import I18nReplacer from '../src';

const root = process.cwd();
let dirsToReplace = [
  'components',
  'hooks',
  'middleware',
  'modules',
  'pages',
  'utils',
];
if (process.argv.slice(2).length > 0) {
  dirsToReplace = process.argv.slice(2);
}
I18nReplacer.createI18nReplacer({
  filesOrDirsToReplace: dirsToReplace
    .map((f) => path.join(root, f))
    .filter((f) => {
      return fs.lstatSync(f).isDirectory();
    }),
});

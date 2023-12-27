#!/usr/bin/env node
import { LocaleReplacer } from '../src';

const inputFiles = process.argv.slice(2);
console.log(inputFiles);
LocaleReplacer.replace({
  projectDir: process.cwd(),
  fileReplaceOverwirte: true,
  filesOrDirsToReplace: inputFiles,
  importPath: 'I18',
});

import { program, Option } from 'commander';
import I18nReplacer, {
  defaultTargets,
  defaultDistLocaleDir,
  defaultLocaleToReplace,
  defaultLocalesToGenerate,
} from '..';
import { availableLocales } from '../types';

export async function cli() {
  program
    .option(
      `-t --targets <fileOrDir...>`,
      `directories or files to extract locales, default is [${defaultTargets()}]`
    )
    .option(
      `-d --distLocaleDir <fileOrDir>`,
      `folder where message files are generated, default is [${defaultDistLocaleDir()}]`
    )
    .addOption(
      new Option(
        `-sl --localeToReplace <fileOrDir>`,
        `locales to search in source code, default is [${defaultLocaleToReplace}]`
      ).choices(availableLocales)
    )
    .addOption(
      new Option(
        `-tl --localesToGenerate <locales...>`,
        `locales to generate, default is [${defaultLocalesToGenerate.join(
          ','
        )}]`
      ).choices(availableLocales)
    )
    .addOption(
      new Option(
        '-f, --I18nFormatterClassAlias <alias>',
        'formatter alias default is [hook]'
      ).choices(['hook', 'global'])
    )
    .option(
      '-e, --excludes <filesOrDirs...>',
      'files or dirs to excludes, default is [node_modules, file or dir start with .]'
    )
    .option('-db, --debug', 'if show extra message, default is [false]')
    .option(
      '-m, --meaningKey',
      'change key to meaning if en-use has corresponding translate, default is [false]'
    );

  program.parse();

  await I18nReplacer.createI18nReplacer(program.opts()).replace();
}

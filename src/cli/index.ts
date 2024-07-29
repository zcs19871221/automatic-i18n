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
        `locale to search in source code, default is [${defaultLocaleToReplace}]`
      ).choices(availableLocales)
    )
    .addOption(
      new Option(
        `-tl --localesToGenerate <locales...>`,
        `locales to generate, default is [${defaultLocalesToGenerate.join(
          ','
        )}] you can input multiple locales with space ex: [-tl en-us zh-cn]`
      ).choices(availableLocales)
    )
    .option(
      '-g, --global',
      'if prefer global intl obj instead hook, default is [false]'
    )
    .option(
      '-e, --excludes <filesOrDirs...>',
      'files or dirs to excludes, default is [node_modules, file or dir start with .]'
    )
    .option('-db, --debug', 'if show extra message, default is [false]')
    .option(
      '-m, --meaningKey',
      'change the key to the English abbreviation if en-us has a translation.Default is [false]'
    );

  program.parse();

  await I18nReplacer.createI18nReplacer(program.opts()).replace();
}

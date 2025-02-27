import { Options as PrettierOptions } from 'prettier';
import { I18nFormatter } from './formatter';
import { ScriptTarget } from 'typescript';

export const availableLocales = ['en-us', 'zh-cn'] as const;
export type LocaleTypes = (typeof availableLocales)[number];

export interface I18nFormatterCtr<A extends I18nFormatter = I18nFormatter> {
  new (): A;
}

export type Filter = (fileOrDir: string, directory: boolean) => boolean;

export interface ReplacerOpt {
  // directories or files to extract locales
  targets?: string[];
  // folder where message files are generated
  distLocaleDir?: string;
  // locale to search in source code
  localeToReplace?: LocaleTypes;
  // which locales will be generated
  localesToGenerate?: LocaleTypes[];
  // if prefer global intl obj instead hook
  global?: boolean;
  // if true, will replace the message key with camel cased english translation
  meaningKey?: boolean;
  // if true, the message key will be generated from the message text, use hash
  uniqIntlKey?: boolean;
  // the class to define how to render the i18n message
  I18nFormatter?: I18nFormatterCtr;
  // a function list to determine whether to replace the file or dir
  filters?: Filter[];
  // a string list to exclude the file or dir if matched
  excludes?: string[];
  // if output debug information
  debug?: boolean;
  // if output to new dir instead of replace the original files
  outputToNewDir?: string;
}

export type HandlerOption = {
  [key in keyof Omit<
    ReplacerOpt,
    'I18nFormatterClass' | 'excludes' | 'outputToNewDir'
  >]-?: ReplacerOpt[key];
} & {
  outputToNewDir?: string;
  prettierOptions?: PrettierOptions;
};

export interface TargetOpt {
  name: string;
  prettierOptions: PrettierOptions | null;
  scriptTarget: ScriptTarget;
}

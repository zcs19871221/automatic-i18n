import { ScriptTarget } from 'typescript';
import { Options as PrettierOptions } from 'prettier';
import { I18nFormatter } from './formatter';

export type localeTypes = 'en-us' | 'zh-cn';

export interface ReplacerOpt {
  i18nDirName?: string;
  localesToGenerate?: localeTypes[];
  localeToReplace?: localeTypes;
  tsTarget?: ScriptTarget;
  formatter?: 'global' | 'hook' | I18nFormatter;
  targetDir?: string;
  filesOrDirsToReplace?: string[];
  fileFilter?: (fileName: string) => boolean;
  prettierConfig?: PrettierOptions;
  outputToNewDir?: false | string;
}

export type HandledOpt = {
  [key in keyof ReplacerOpt]-?: key extends 'formatter'
    ? I18nFormatter
    : ReplacerOpt[key];
};

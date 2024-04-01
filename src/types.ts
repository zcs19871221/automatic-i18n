import { ScriptTarget } from 'typescript';
import { Options as PrettierOptions } from 'prettier';

export type localeTypes = 'en-us' | 'zh-cn';

export interface OptionOpt {
  i18nDirName?: string;
  localesToGenerate?: localeTypes[];
  localeToReplace?: localeTypes;
  tsTarget?: ScriptTarget;
}

export type BaseOpt = (
  | {
      readonly fileReplaceOverwrite: true;
      readonly fileReplaceDist?: never;
    }
  | {
      readonly fileReplaceDist: string;
      readonly fileReplaceOverwrite?: never;
    }
) & {
  readonly projectDir: string;
  readonly importPath: string;
  readonly filesOrDirsToReplace: string[];
  readonly fileFilter?: (fileName: string) => boolean;
  prettierConfig?: PrettierOptions;
};

export type Opt = BaseOpt & {
  readonly [key in keyof OptionOpt]-?: OptionOpt[key];
};

export type InputOption = BaseOpt & OptionOpt;

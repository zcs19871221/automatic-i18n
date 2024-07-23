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
  targets?: string[];
  distLocaleDir?: string;
  localeToReplace?: LocaleTypes;
  localesToGenerate?: LocaleTypes[];
  I18nFormatterClass?: I18nFormatterCtr;
  I18nFormatterClassAlias?: 'hook' | 'global';
  meaningKey?: boolean;
  filters?: Filter[];
  // baseNames
  excludes?: string[];
  debug?: boolean;
  outputToNewDir?: string;
}

export type HandledOpt = {
  [key in keyof Omit<
    ReplacerOpt,
    | 'I18nFormatterClass'
    | 'I18nFormatterClassAlias'
    | 'excludes'
    | 'outputToNewDir'
  >]-?: ReplacerOpt[key];
} & {
  I18nFormatter: I18nFormatterCtr;
  outputToNewDir?: string;
  prettierOptions?: PrettierOptions;
};

export interface TargetOpt {
  name: string;
  prettierOptions: PrettierOptions | null;
  scriptTarget: ScriptTarget;
}

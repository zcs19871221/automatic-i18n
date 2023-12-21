import * as fs from 'fs-extra';
import * as path from 'path';

import { BundleReplacer } from './BundleReplacer';
import { InputOption, Opt } from './types';
import { ScriptTarget } from 'typescript';

export class LocaleReplacer {
  public static async replace(opt: InputOption) {
    try {
      let tsTarget = opt.tsTarget;
      if (
        !tsTarget &&
        (await fs.exists(path.join(opt.projectDir, 'tsconfig.json')))
      ) {
        const tsConfig =
          (await fs.readJson(path.join(opt.projectDir, 'tsconfig.json'), {
            throws: false,
          })) ?? {};
        tsTarget = ScriptTarget[tsConfig?.compilerOptions?.target] as any;
        if (tsTarget) {
          console.log(
            'use tsTarget value ' +
              ScriptTarget[tsTarget] +
              ' from tsconfig.json in project dir '
          );
        }
      }
      let prettierConfig = opt.prettierConfig;
      if (
        !prettierConfig &&
        (await fs.exists(path.join(opt.projectDir, '.prettierrc.js')))
      ) {
        try {
          prettierConfig = require(path.join(opt.projectDir, '.prettierrc.js'));
          console.log(
            'use prettierConfig:' +
              JSON.stringify(prettierConfig, null, 2) +
              ' from .prettier.js in project dir '
          );
        } catch {}
      }

      const replaceOpt: Opt = {
        ...opt,
        i18nDirName: opt.i18nDirName ?? 'i18n',
        localesToGenerate: opt.localesToGenerate ?? ['en-us', 'zh-cn'],
        localeToReplace: 'zh-cn',
        tsTarget: tsTarget ?? ScriptTarget.ESNext,
        prettierConfig,
      };
      if (!replaceOpt.localesToGenerate.includes(replaceOpt.localeToReplace)) {
        replaceOpt.localesToGenerate.push(replaceOpt.localeToReplace);
      }
      const replaceBundle = new BundleReplacer(replaceOpt);
      return await replaceBundle.replace();
    } catch (error) {
      console.error(error);
    }
  }
}

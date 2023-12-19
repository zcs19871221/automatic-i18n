import * as fs from 'fs-extra';
import * as path from 'path';

import { FileReplacer } from './FileReplacer';
import { Opt } from './types';

export class BundleReplacer {
  private static textKeyTypeFileName: string = 'textKeyType.ts';

  constructor(public readonly opt: Opt) {
    const { projectDir, debug, i18nDir } = this.opt;

    if (!this.opt.locales.includes(this.opt.localeToSearch)) {
      this.opt.locales.push(this.opt.localeToSearch);
    }

    this.langDir = path.join(projectDir, i18nDir);
    const keyMappingText =
      fs.readJSONSync(path.join(this.langDir, opt.localeToSearch), {
        throws: false,
      }) ?? {};
    this.localeToSearchMappingKey = Object.entries<string>(
      keyMappingText
    ).reduce((localeMappingKey: Record<string, string>, [key, text]) => {
      if (!localeMappingKey[text]) {
        localeMappingKey[text] = key;
      }
      return localeMappingKey;
    }, {});

    console.debug = (...args: any[]) => {
      if (debug) {
        console.log(' '.repeat(this.debugIndent), ...args);
      }
    };
  }

  public replace() {
    try {
      if (this.opt.fileReplaceDist) {
        fs.ensureDirSync(this.opt.fileReplaceDist);
      }

      fs.copySync(
        path.join(process.cwd(), 'src/template'),
        path.join(this.opt.projectDir, this.opt.i18nDir)
      );

      this.replaceAllFiles();

      let textKeys: null | string[] = null;

      this.opt.locales.forEach((name) => {
        const languageJson = path.join(this.langDir, `${name}.json`);
        let keyMappingText: Record<string, string> =
          fs.readJSONSync(languageJson, { throws: false }) ?? {};

        Object.keys(this.localeToSearchMappingKey).forEach((text) => {
          let key = this.localeToSearchMappingKey[text];

          if (!keyMappingText[key]) {
            keyMappingText[key] = text;
          }
        });

        keyMappingText = Object.keys(keyMappingText)
          .sort()
          .reduce((obj, key) => {
            obj[key] = keyMappingText[key];
            return obj;
          }, {});
        if (!textKeys) {
          textKeys = Object.keys(keyMappingText);
        } else if (
          textKeys.join(',') !== Object.keys(keyMappingText).join(',')
        ) {
          throw new Error(this.opt.locales.join(',') + ' exits different keys');
        }

        fs.writeFileSync(languageJson, JSON.stringify(keyMappingText, null, 2));
        console.log('create ' + languageJson + ' successful! 😃');
      });

      fs.writeFileSync(
        path.join(this.langDir, BundleReplacer.textKeyTypeFileName),
        `/*
 * This file will be overwirted by automatic program.
 * Please don't add extra codes here!
 */
export type TEXT_KEYS = '${textKeys.join("'|'")}';`
      );
    } catch (error) {
      console.error(error);
    }
  }

  public getOrSetLocaleTextKeyIfAbsence(localeText: string) {
    let textKey = '';
    if (this.localeToSearchMappingKey[localeText]) {
      textKey = this.localeToSearchMappingKey[localeText];
    } else {
      do {
        textKey = `key${String(this.key++).padStart(4, '0')}`;
      } while (Object.values(this.localeToSearchMappingKey).includes(textKey));
      this.localeToSearchMappingKey[localeText] = textKey;
    }

    return FileReplacer.localeMapToken + textKey;
  }

  private localeToSearchMappingKey: Record<string, string>;

  private key: number = 1;

  private readonly langDir: string;

  private fileFilter = (name: string) => {
    if (name.startsWith('.')) {
      return false;
    }

    if (name.includes('node_modules')) {
      return false;
    }

    if (name.match(/\..*$/) && !name.match(/\.([jt]sx?)$/)) {
      return false;
    }

    if (this.opt.filter) {
      return this.opt.filter(name);
    }

    return true;
  };

  private debugIndent = 0;

  private replaceAllFiles(
    filesOrDirs: string[] = this.opt.filesOrDirsToReplace
  ): void {
    filesOrDirs = filesOrDirs.filter(this.fileFilter);
    filesOrDirs.sort();
    filesOrDirs.forEach((fileOrDir) => {
      if (fs.lstatSync(fileOrDir).isDirectory()) {
        return this.replaceAllFiles(
          fs.readdirSync(fileOrDir).map((d) => path.join(fileOrDir, d))
        );
      }

      const fileReplaceInfo = new FileReplacer(fileOrDir, this, this.opt);
      fileReplaceInfo.replace();
    });
  }
}

import * as fs from 'fs-extra';
import * as path from 'path';
import * as prettier from 'prettier';

import { FileReplacer } from './FileReplacer';
import { renderEntryFile } from './static-template/entryFile';
import { renderLocaleFile } from './static-template/localeFile';
import { Opt } from './types';
import ts, { PropertyAssignment, ScriptTarget } from 'typescript';

export class BundleReplacer {
  constructor(private readonly opt: Opt) {
    this.langDir = path.join(this.opt.projectDir, this.opt.i18nDirName);
  }

  public replace() {
    const keyMappingText = BundleReplacer.parseLocaleTsFile(
      path.join(this.langDir, this.opt.localeToReplace + '.ts'),
      this.opt.tsTarget
    );
    this.localeTextMappingKey = Object.entries<string>(keyMappingText).reduce(
      (localeMappingKey: Record<string, string>, [key, text]) => {
        if (!localeMappingKey[text]) {
          localeMappingKey[text] = key;
        }
        return localeMappingKey;
      },
      {}
    );

    if (this.opt.fileReplaceDist) {
      fs.ensureDirSync(this.opt.fileReplaceDist);
    }

    this.replaceAllFiles();

    this.generateLocaleFiles();

    this.warnings.forEach((warn) => {
      console.warn(warn);
      console.log('\n');
    });
  }

  public getOrSetLocaleTextKeyIfAbsence(localeText: string) {
    let textKey = '';
    if (this.localeTextMappingKey[localeText]) {
      textKey = this.localeTextMappingKey[localeText];
    } else {
      do {
        textKey = `key${String(this.key++).padStart(4, '0')}`;
      } while (Object.values(this.localeTextMappingKey).includes(textKey));
      this.localeTextMappingKey[localeText] = textKey;
    }

    return textKey;
  }

  public warnings: Set<string> = new Set();

  public static stringifyObject(obj: Record<string, string>) {
    return (
      Object.entries(obj).reduce((content, [key, text]) => {
        if (key.includes('-')) {
          key = `'"' + key + '"'`;
        }
        content += `  ${key}: '${text}',\n`;
        return content;
      }, '{') + '};\n'
    );
  }
  private generateLocaleFiles() {
    let textKeys: null | string[] = null;

    fs.ensureDirSync(this.langDir);

    this.opt.localesToGenerate.forEach((name) => {
      const localeFile = path.join(this.langDir, `${name}.ts`);
      let keyMappingText: Record<string, string> =
        BundleReplacer.parseLocaleTsFile(localeFile, this.opt.tsTarget);

      let changed = false;
      Object.keys(this.localeTextMappingKey).forEach((text) => {
        let key = this.localeTextMappingKey[text];

        if (!keyMappingText[key]) {
          keyMappingText[key] = text;
          changed = true;
        }
      });

      if (!changed) {
        return;
      }
      keyMappingText = Object.keys(keyMappingText)
        .sort()
        .reduce((obj: Record<string, string>, key) => {
          obj[key] = keyMappingText[key];
          return obj;
        }, {});
      if (!textKeys) {
        textKeys = Object.keys(keyMappingText);
      } else if (textKeys.join(',') !== Object.keys(keyMappingText).join(',')) {
        throw new Error(
          this.opt.localesToGenerate.join(',') + ' exits different keys'
        );
      }

      return this.formatAndWrite(
        localeFile,
        renderLocaleFile(name, keyMappingText, this.opt.localeToReplace)
      );
    });

    const templateDist = path.join(
      this.opt.projectDir,
      this.opt.i18nDirName,
      'index.ts'
    );

    if (fs.existsSync(templateDist)) {
      return;
    }

    this.formatAndWrite(
      templateDist,
      renderEntryFile(this.opt.localesToGenerate, this.opt.localeToReplace)
    );
  }

  private formatAndWrite(dist: string, file: string) {
    if (this.opt.prettierConfig) {
      try {
        file = prettier.format(file, this.opt.prettierConfig);
      } catch (error) {
        console.warn(error);
      }
    }

    return fs.writeFileSync(dist, file);
  }

  public static parseLocaleTsFile(fileLocate: string, target: ScriptTarget) {
    if (!fs.existsSync(fileLocate)) {
      return {};
    }
    const source = ts.createSourceFile(
      fileLocate,
      fs.readFileSync(fileLocate, 'utf-8'),
      target,
      true
    );
    const obj = {};
    BundleReplacer.parse(source, obj);
    return obj;
  }

  private static parse(node: ts.Node, obj: Record<string, string>) {
    if (node.kind === ts.SyntaxKind.PropertyAssignment) {
      const name = (node as PropertyAssignment).name.getText();
      const value = (node as PropertyAssignment).initializer.getText();
      obj[name] = value.replace(/(^['"])|(['"]$)/g, '');
    }
    ts.forEachChild(node, (n) => BundleReplacer.parse(n, obj));
  }

  private localeTextMappingKey: Record<string, string> = {};

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

    if (this.opt.fileFilter) {
      return this.opt.fileFilter(name);
    }

    return true;
  };

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

      const fileReplaceInfo = new FileReplacer(
        fileOrDir,
        this,
        this.opt,
        fs.readFileSync(fileOrDir, 'utf-8')
      );
      const file = fileReplaceInfo.replace();
      if (!file) {
        return;
      }

      if (this.opt.fileReplaceOverwirte) {
        this.formatAndWrite(fileOrDir, file);
        console.log(fileOrDir + ' rewrite sucessful! 😃');
      } else {
        this.formatAndWrite(
          path.join(this.opt.fileReplaceDist, path.basename(fileOrDir)),
          file
        );
        console.log(
          fileOrDir + ' write to ' + this.opt.fileReplaceDist + ' sucessful! 😃'
        );
      }
    });
  }
}

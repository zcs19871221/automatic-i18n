import * as fs from 'fs-extra';
import * as path from 'path';
import * as prettier from 'prettier';

import { FileReplacer } from './FileReplacer';
import { Opt } from './types';
import ts, { PropertyAssignment } from 'typescript';

const notTouchWarning = `/*
 * This file will be add extra properies by automatic program.
 * Don't change export name and don't add extra object here.
 */
`;

export class BundleReplacer {
  constructor(private readonly opt: Opt) {
    this.langDir = path.join(this.opt.projectDir, this.opt.i18nDirName);
  }

  public replace() {
    const keyMappingText = this.parseLocaleTsFile(
      path.join(this.langDir, this.opt.localeToReplace + '.ts')
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

    return FileReplacer.localeMapToken + textKey;
  }

  public warnings: Set<string> = new Set();

  private generateLocaleFiles() {
    let textKeys: null | string[] = null;

    fs.ensureDirSync(this.langDir);
    const defaultLocaleNaming = this.camel(this.opt.localeToReplace);

    this.opt.localesToGenerate.map((name) => {
      const localeFile = path.join(this.langDir, `${name}.ts`);
      let keyMappingText: Record<string, string> =
        this.parseLocaleTsFile(localeFile);

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

      const defaultLocale = name === this.opt.localeToReplace;
      let localePrevContent = notTouchWarning;
      let localeEndContent = '';
      if (defaultLocale) {
        localePrevContent = `const defaultLocales = {\n`;
        localeEndContent =
          '};\n' +
          `
export type Locales = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key in keyof typeof defaultLocales]: any;
};\n\nexport const locales: Locales = defaultLocales;`;
      } else {
        localePrevContent = `import { Locales } from './${this.opt.localeToReplace}';\n\nexport const locales: Locales = {\n`;
        localeEndContent = '};\n';
      }
      return this.formatAndWrite(
        localeFile,
        Object.entries(keyMappingText).reduce((content, [key, text]) => {
          if (key.includes('-')) {
            key = '"' + key + '"';
          }
          content += `  ${key}: '${text}',\n`;
          return content;
        }, localePrevContent) + localeEndContent
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

    const otherLocales = this.opt.localesToGenerate.filter(
      (locale) => locale !== this.opt.localeToReplace
    );

    let templateContent = fs
      .readFileSync(
        path.join(process.cwd(), 'src/static-template/index.ts'),
        'utf-8'
      )
      .replace(/zh-cn/g, this.opt.localeToReplace)
      .replace(/zhCn/g, defaultLocaleNaming);
    if (otherLocales.length > 0) {
      templateContent = templateContent
        .replace('/* othersLocalesImport */', () => {
          return (
            otherLocales
              .map(
                (l) => `import { locales as ${this.camel(l)} } from './${l}';`
              )
              .join('\n') + '\n'
          );
        })
        .replace('/* othersLocalesName */', () => {
          return ',' + otherLocales.map((l) => `'${l}'`).join(', ');
        })
        .replace('/* othersLocalesNameMapping */', () => {
          return (
            otherLocales.map((l) => `'${l}': ${this.camel(l)}`).join(',\n') +
            ',\n'
          );
        });
    }
    this.formatAndWrite(templateDist, templateContent);
  }

  private formatAndWrite(dist: string, file: string) {
    if (this.opt.prettierConfig) {
      try {
        file = prettier.format(file, {
          singleQuote: true,
          trailingComma: 'es5',
        });
      } catch {}
    }

    return fs.writeFileSync(dist, file);
  }

  private parseLocaleTsFile(fileLocate: string) {
    if (!fs.existsSync(fileLocate)) {
      return {};
    }
    const source = ts.createSourceFile(
      fileLocate,
      fs.readFileSync(fileLocate, 'utf-8'),
      this.opt.tsTarget,
      true
    );
    const obj = {};
    this.parse(source, obj);
    return obj;
  }

  parse(node: ts.Node, obj: Record<string, string>) {
    if (node.kind === ts.SyntaxKind.PropertyAssignment) {
      const name = (node as PropertyAssignment).name.getText();
      const value = (node as PropertyAssignment).initializer.getText();
      obj[name] = value.replace(/(^['"])|(['"]$)/g, '');
    }
    ts.forEachChild(node, (n) => this.parse(n, obj));
  }

  private camel(naming: string) {
    const splitIndex = naming.indexOf('-');
    if (splitIndex > -1) {
      return (
        naming.slice(0, splitIndex) +
        naming[splitIndex + 1].toUpperCase() +
        naming.slice(splitIndex + 2)
      );
    }
    return naming;
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

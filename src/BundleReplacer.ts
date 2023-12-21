import * as fs from 'fs-extra';
import * as path from 'path';

import { FileReplacer } from './FileReplacer';
import { Opt } from './types';
import ts, { PropertyAssignment } from 'typescript';

const notTouchWarning = `/*
 * This file will be add extra properies by automatic program.
 * Don't change export name and don't add extra object here.
 */
`;

export class BundleReplacer {
  public readonly opt: Exclude<Opt, 'i18nDir'> & { i18nDir: string };

  constructor(opt: Opt) {
    const { projectDir, debug } = opt;
    const i18nDir = opt.i18nDir ?? 'i18n';
    this.opt = { ...opt, i18nDir };

    if (!this.opt.locales.includes(this.opt.localeToSearch)) {
      this.opt.locales.push(this.opt.localeToSearch);
    }

    this.langDir = path.join(projectDir, i18nDir);
    const keyMappingText = this.parseLocaleTsFile(
      path.join(this.langDir, opt.localeToSearch + '.ts')
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

      this.replaceAllFiles();

      this.handleStaticTemplate();

      this.warnings.forEach((warn) => {
        console.warn(warn);
        console.log('\n');
      });
    } catch (error) {
      console.error(error);
    }
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

  public warnings: string[] = [];

  private handleStaticTemplate() {
    let textKeys: null | string[] = null;

    const defaultLocaleNaming = this.camel(this.opt.defaultLocale);
    this.opt.locales.forEach((name) => {
      const localeFile = path.join(this.langDir, `${name}.ts`);
      let keyMappingText: Record<string, string> =
        this.parseLocaleTsFile(localeFile);

      Object.keys(this.localeTextMappingKey).forEach((text) => {
        let key = this.localeTextMappingKey[text];

        if (!keyMappingText[key]) {
          keyMappingText[key] = text;
        }
      });

      keyMappingText = Object.keys(keyMappingText)
        .sort()
        .reduce((obj: Record<string, string>, key) => {
          obj[key] = keyMappingText[key];
          return obj;
        }, {});
      if (!textKeys) {
        textKeys = Object.keys(keyMappingText);
      } else if (textKeys.join(',') !== Object.keys(keyMappingText).join(',')) {
        throw new Error(this.opt.locales.join(',') + ' exits different keys');
      }

      const defaultLocale = name === this.opt.defaultLocale;
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
        localePrevContent = `import { Locales } from './${this.opt.defaultLocale}';\n\nexport const locales: Locales = {\n`;
        localeEndContent = '};\n';
      }
      fs.writeFileSync(
        localeFile,
        Object.entries(keyMappingText).reduce((content, [key, text]) => {
          if (key.includes('-')) {
            key = '"' + key + '"';
          }
          content += `  ${key}: '${text}',\n`;
          return content;
        }, localePrevContent) + localeEndContent
      );
      console.log('create ' + localeFile + ' successful! 😃');
    });

    const templateDist = path.join(
      this.opt.projectDir,
      this.opt.i18nDir,
      'index.ts'
    );

    if (fs.existsSync(templateDist)) {
      return;
    }

    const otherLocales = this.opt.locales.filter(
      (locale) => locale !== this.opt.defaultLocale
    );

    let templateContent = fs
      .readFileSync(
        path.join(process.cwd(), 'src/static-template/index.ts'),
        'utf-8'
      )
      .replace(/zh-cn/g, this.opt.defaultLocale)
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
    fs.writeFileSync(templateDist, templateContent);
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
  private localeTextMappingKey: Record<string, string>;

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

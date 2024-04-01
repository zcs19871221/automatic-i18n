import * as fs from 'fs-extra';
import * as path from 'path';
import ts, {
  PropertyAssignment,
  ScriptTarget,
  Node,
  createSourceFile,
} from 'typescript';
import * as prettier from 'prettier';

import { renderEntryFile } from './static-template/entryFile';
import { renderLocaleFile } from './static-template/localeFile';
import { Opt } from './types';
import { FileContext } from './replaceContexts';

export class BundleReplacer {
  constructor(public readonly opt: Opt) {
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

  public warnings: Set<string> = new Set();

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

      try {
        return this.formatAndWrite(
          localeFile,
          renderLocaleFile(name, keyMappingText, this.opt.localeToReplace)
        );
      } catch (error) {
        console.log(localeFile);
        console.error(error);
      }
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

  public localeTextMappingKey: Record<string, string> = {};

  public key: number = 1;

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
        const dir = fileOrDir;
        return this.replaceAllFiles(
          fs.readdirSync(dir).map((d) => path.join(fileLocate, d))
        );
      }

      const fileLocate = fileOrDir;

      const file = fs.readFileSync(fileLocate, 'utf-8');
      let replacedText = '';

      let fileContext: FileContext | null = null;
      try {
        const node = createSourceFile(
          fileLocate,
          file,
          this.opt.tsTarget,
          true
        );

        fileContext = new FileContext({
          node,
          file,
          fileLocate,
          bundleReplacer: this,
        });

        replacedText = fileContext.generateNewText();
        if (replacedText && fileContext.hasImportedI18nModules) {
          const tsUncheckCommentMatched = file.match(
            /(\n|^)\/\/\s*@ts-nocheck[^\n]*\n/
          );
          const insertIndex =
            tsUncheckCommentMatched === null
              ? 0
              : (tsUncheckCommentMatched.index ?? 0) +
                tsUncheckCommentMatched[0].length;
          replacedText =
            replacedText.slice(0, insertIndex) +
            this.createImportStatement() +
            replacedText.slice(insertIndex);
        }
      } catch (error: any) {
        if (error.message) {
          error.message = '@ ' + fileLocate + ' ' + error.message;
        }
        console.error(error);
      } finally {
        fileContext?.clear();
      }

      if (!replacedText) {
        return;
      }

      if (this.opt.fileReplaceOverwrite) {
        this.formatAndWrite(fileLocate, replacedText);
        console.log(fileLocate + ' rewrite successful! 😃');
      } else {
        this.formatAndWrite(
          path.join(this.opt.fileReplaceDist, path.basename(fileLocate)),
          replacedText
        );
        console.log(
          fileLocate +
            ' write to ' +
            this.opt.fileReplaceDist +
            ' successful! 😃'
        );
      }
    });
  }

  public exportName = 'i18';

  public createIntlExpressionFromIntlId(
    intlId: string,
    param?: Record<string, string>
  ) {
    let paramsString = '';
    if (param && Object.keys(param).length > 0) {
      paramsString += ',';
      paramsString +=
        Object.entries<string>(param).reduce((text: string, [key, value]) => {
          if (key === value) {
            return text + key + ',';
          } else {
            return text + `${key}: ${value === '' ? "''" : value}` + ',';
          }
        }, '{') + '}';
    }
    return `${this.exportName}.${this.property}.formatMessage({id: '${intlId}'}${paramsString})`;
  }

  private createImportStatement() {
    return `import { ${this.exportName} } from '${this.opt.importPath}';\n`;
  }

  public getOrCreateIntlId(localeText: string) {
    localeText = localeText.replace(/\n/g, '\\n');
    let intlId = '';
    const localeTextMappingKey = this.localeTextMappingKey;
    if (localeTextMappingKey[localeText]) {
      intlId = localeTextMappingKey[localeText];
    } else {
      do {
        intlId = `key${String(this.key++).padStart(4, '0')}`;
      } while (Object.values(localeTextMappingKey).includes(intlId));
      localeTextMappingKey[localeText] = intlId;
    }

    return intlId;
  }

  public ignore(node: Node) {
    return node.getFullText().includes(this.ignoreWarningKey);
  }

  public addWarningInfo({
    start,
    end,
    text,
    fileContext,
  }: {
    start: number;
    end: number;
    text: string;
    fileContext: FileContext;
  }) {
    this.warnings.add(
      text +
        '\nfile at: ' +
        fileContext.fileLocate +
        '\ntext: ' +
        fileContext.file.slice(Math.max(0, start - 3), start) +
        '【' +
        fileContext.file.slice(start, end) +
        '】' +
        fileContext.file.slice(end + 1, end + 4) +
        '\n'
    );
  }

  public includesTargetLocale(text: string) {
    return /[\u4e00-\u9fa5]+/g.test(text);
  }

  private property = 'intl';
  public ignoreWarningKey = '@ignore';
}

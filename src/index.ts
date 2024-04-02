import * as fs from 'fs-extra';
import * as path from 'path';
import type { Options as PrettierOptions } from 'prettier';
import ts, { PropertyAssignment, Node, createSourceFile } from 'typescript';
import * as prettier from 'prettier';

import { FileContext } from './replaceContexts';
import { HandledOpt, ReplacerOpt } from './types';
import { ScriptTarget } from 'typescript';
import {
  HookI18nFormatter,
  GlobalI18nFormatter,
  I18nFormatter,
} from './formatter';

export class I18nReplacer {
  private static getTsTarget(targetDir: string): ScriptTarget {
    if (fs.existsSync(path.join(targetDir, 'tsconfig.json'))) {
      const tsConfig =
        fs.readJsonSync(path.join(targetDir, 'tsconfig.json'), {
          throws: false,
        }) ?? {};
      return ScriptTarget[
        tsConfig?.compilerOptions?.target
      ] as unknown as ScriptTarget;
    }
    return ScriptTarget.ES2015;
  }

  private static getFormatter(formatter: ReplacerOpt['formatter']) {
    let usedFormatter: I18nFormatter = new GlobalI18nFormatter();
    if (formatter === 'hook') {
      usedFormatter = new HookI18nFormatter();
    } else if (formatter === 'global') {
      usedFormatter = new GlobalI18nFormatter();
    } else if (formatter != undefined) {
      usedFormatter = formatter;
    }
    return usedFormatter;
  }

  private static getPrettierConfig(
    targetDir: string,
    prettierConfig?: PrettierOptions
  ): PrettierOptions {
    let usedPrettierConfig: PrettierOptions = prettierConfig ?? {
      singleQuote: true,
      tabWidth: 2,
    };
    if (
      !prettierConfig &&
      fs.existsSync(path.join(targetDir, '.prettierrc.js'))
    ) {
      try {
        const prettierConfigPath = path.join(targetDir, '.prettierrc.js');
        usedPrettierConfig = require(prettierConfigPath);
      } catch {}
    }
    usedPrettierConfig.parser = usedPrettierConfig.parser ?? 'typescript';
    return usedPrettierConfig;
  }

  public static init({
    localesToGenerate,
    localeToReplace,
    tsTarget,
    formatter: render,
    targetDir,
    filesOrDirsToReplace,
    fileFilter,
    prettierConfig,
    outputToNewDir,
    i18nDirName,
  }: ReplacerOpt = {}): I18nReplacer {
    let usedTargetDir = targetDir ?? process.cwd();
    const handledOpt: HandledOpt = {
      targetDir: usedTargetDir,
      localeToReplace: localeToReplace ?? 'zh-cn',
      localesToGenerate: localesToGenerate ?? ['en-us', 'zh-cn'],
      i18nDirName: i18nDirName ?? 'i18n',
      tsTarget: tsTarget ?? I18nReplacer.getTsTarget(usedTargetDir),
      formatter: I18nReplacer.getFormatter(render),
      filesOrDirsToReplace: filesOrDirsToReplace ?? [usedTargetDir],
      fileFilter: fileFilter ?? (() => true),
      prettierConfig: I18nReplacer.getPrettierConfig(
        usedTargetDir,
        prettierConfig
      ),
      outputToNewDir:
        typeof outputToNewDir === 'string' ? outputToNewDir : false,
    };
    handledOpt.localesToGenerate = [
      ...new Set([handledOpt.localeToReplace, ...handledOpt.localesToGenerate]),
    ];

    return new I18nReplacer(handledOpt);
  }

  public readonly formatter: I18nFormatter;
  private constructor(public readonly opt: HandledOpt) {
    this.langDir = path.join(this.opt.targetDir, this.opt.i18nDirName);
    this.formatter = opt.formatter;
  }

  public replace() {
    const keyMappingText = I18nReplacer.parseLocaleTsFile(
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

    if (this.opt.outputToNewDir) {
      fs.ensureDirSync(this.opt.outputToNewDir);
    }

    this.replaceAllFiles();

    this.generateLocaleFiles();

    this.warnings.forEach((warn) => {
      console.warn(warn);
      console.log('\n');
    });
  }

  private warnings: Set<string> = new Set();

  private generateLocaleFiles() {
    let textKeys: null | string[] = null;

    fs.ensureDirSync(this.langDir);

    this.opt.localesToGenerate.forEach((name) => {
      const localeFile = path.join(this.langDir, `${name}.ts`);
      let keyMappingText: Record<string, string> =
        I18nReplacer.parseLocaleTsFile(localeFile, this.opt.tsTarget);

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
          this.formatter.generateLocaleFiles(keyMappingText)
        );
      } catch (error) {
        console.log(localeFile);
        console.error(error);
      }
    });

    const templateDist = path.join(
      this.opt.targetDir,
      this.opt.i18nDirName,
      'index.ts'
    );

    if (fs.existsSync(templateDist)) {
      return;
    }

    this.formatAndWrite(
      templateDist,
      this.formatter.entryFile(
        this.opt.localesToGenerate,
        this.opt.localeToReplace
      )
    );
    this.formatAndWrite(
      path.join(this.opt.targetDir, this.opt.i18nDirName, 'types.ts'),
      this.formatter.generateTypeFile(
        this.opt.localesToGenerate,
        textKeys ?? []
      )
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
    I18nReplacer.parse(source, obj);
    return obj;
  }

  private static parse(node: ts.Node, obj: Record<string, string>) {
    if (node.kind === ts.SyntaxKind.PropertyAssignment) {
      const name = (node as PropertyAssignment).name.getText();
      const value = (node as PropertyAssignment).initializer.getText();
      obj[name] = value.replace(/(^['"])|(['"]$)/g, '');
    }
    ts.forEachChild(node, (n) => I18nReplacer.parse(n, obj));
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
          i18nReplacer: this,
        });

        replacedText = fileContext.generateNewText();
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

      if (this.opt.outputToNewDir) {
        this.formatAndWrite(
          path.join(this.opt.outputToNewDir, path.basename(fileLocate)),
          replacedText
        );
        console.log(
          fileLocate +
            ' write to ' +
            this.opt.outputToNewDir +
            ' successful! 😃'
        );
      } else {
        this.formatAndWrite(fileLocate, replacedText);
        console.log(fileLocate + ' rewrite successful! 😃');
      }
    });
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

  public ignoreWarningKey = '@ignore';
}

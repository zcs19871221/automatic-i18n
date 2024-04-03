import * as fs from 'fs-extra';
import * as path from 'path';
import type { Options as PrettierOptions } from 'prettier';
import {
  PropertyAssignment,
  Node,
  createSourceFile,
  SyntaxKind,
  forEachChild,
} from 'typescript';
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
  public static createI18nReplacer({
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
      tsTarget:
        tsTarget ??
        I18nReplacer.getTypeScriptTargetCompilerOption(usedTargetDir),
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

  private static getTypeScriptTargetCompilerOption(
    targetDir: string
  ): ScriptTarget {
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

  public static getIntlIdMapLocaleTextFromExistingLocaleTextFile(
    fileLocate: string,
    target: ScriptTarget
  ) {
    if (!fs.existsSync(fileLocate)) {
      return {};
    }
    const source = createSourceFile(
      fileLocate,
      fs.readFileSync(fileLocate, 'utf-8'),
      target,
      true
    );
    const obj = {};
    I18nReplacer.createMapFromAstNodeRecursively(source, obj);
    return obj;
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

  private warnings: Set<string> = new Set();
  private ignoreComment = '@ignore';

  public readonly formatter: I18nFormatter;
  private constructor(public readonly opt: HandledOpt) {
    this.langDir = path.join(this.opt.targetDir, this.opt.i18nDirName);
    this.formatter = opt.formatter;
  }

  public replace() {
    const intlIdMapLocaleText =
      I18nReplacer.getIntlIdMapLocaleTextFromExistingLocaleTextFile(
        path.join(this.langDir, this.opt.localeToReplace + '.ts'),
        this.opt.tsTarget
      );

    this.localeTextMappingIntlId = Object.entries<string>(
      intlIdMapLocaleText
    ).reduce((localeMappingKey: Record<string, string>, [key, text]) => {
      if (!localeMappingKey[text]) {
        localeMappingKey[text] = key;
      }
      return localeMappingKey;
    }, {});

    if (this.opt.outputToNewDir) {
      fs.ensureDirSync(this.opt.outputToNewDir);
    }

    this.replaceLocaleTextWithFormattedIntl(this.opt.filesOrDirsToReplace);

    this.generateLocaleTextFiles();

    this.warnings.forEach((warn) => {
      console.warn(warn);
      console.log('\n');
    });
  }

  public getIgnoreComment() {
    return this.ignoreComment;
  }

  public ignore(node: Node) {
    return node.getFullText().includes(this.ignoreComment);
  }

  public addWarning({
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

  private generateLocaleTextFiles() {
    let textKeys: null | string[] = null;

    fs.ensureDirSync(this.langDir);

    this.opt.localesToGenerate.forEach((name) => {
      const localeFile = path.join(this.langDir, `${name}.ts`);
      let keyMappingText: Record<string, string> =
        I18nReplacer.getIntlIdMapLocaleTextFromExistingLocaleTextFile(
          localeFile,
          this.opt.tsTarget
        );

      let changed = false;
      Object.keys(this.localeTextMappingIntlId).forEach((text) => {
        let key = this.localeTextMappingIntlId[text];

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
        return this.formatThenWrite(
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

    this.formatThenWrite(
      templateDist,
      this.formatter.entryFile(
        this.opt.localesToGenerate,
        this.opt.localeToReplace
      )
    );
    this.formatThenWrite(
      path.join(this.opt.targetDir, this.opt.i18nDirName, 'types.ts'),
      this.formatter.generateTypeFile(
        this.opt.localesToGenerate,
        textKeys ?? []
      )
    );
  }

  private formatThenWrite(dist: string, file: string) {
    if (this.opt.prettierConfig) {
      try {
        file = prettier.format(file, this.opt.prettierConfig);
      } catch (error) {
        console.warn(error);
      }
    }

    return fs.writeFileSync(dist, file);
  }

  private static createMapFromAstNodeRecursively(
    astNode: Node,
    intlIdMapLocaleText: Record<string, string> = {}
  ) {
    if (astNode.kind === SyntaxKind.PropertyAssignment) {
      const name = (astNode as PropertyAssignment).name.getText();
      const value = (astNode as PropertyAssignment).initializer.getText();
      intlIdMapLocaleText[name] = value.replace(/(^['"])|(['"]$)/g, '');
    }
    forEachChild(astNode, (n) =>
      I18nReplacer.createMapFromAstNodeRecursively(n, intlIdMapLocaleText)
    );
  }

  private localeTextMappingIntlId: Record<string, string> = {};

  private intlSeq: number = 1;

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

  private replaceLocaleTextWithFormattedIntl(
    filesOrDirsToReplace: string[]
  ): void {
    filesOrDirsToReplace = filesOrDirsToReplace.filter(this.fileFilter);
    filesOrDirsToReplace.sort();
    filesOrDirsToReplace.forEach((fileOrDir) => {
      if (fs.lstatSync(fileOrDir).isDirectory()) {
        const dir = fileOrDir;
        return this.replaceLocaleTextWithFormattedIntl(
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
        this.formatThenWrite(
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
        this.formatThenWrite(fileLocate, replacedText);
        console.log(fileLocate + ' rewrite successful! 😃');
      }
    });
  }

  public getOrCreateIntlId(localeText: string) {
    localeText = localeText.replace(/\n/g, '\\n');
    let intlId = '';
    if (this.localeTextMappingIntlId[localeText]) {
      intlId = this.localeTextMappingIntlId[localeText];
    } else {
      do {
        intlId = `key${String(this.intlSeq++).padStart(4, '0')}`;
      } while (Object.values(this.localeTextMappingIntlId).includes(intlId));
      this.localeTextMappingIntlId[localeText] = intlId;
    }

    return intlId;
  }
}

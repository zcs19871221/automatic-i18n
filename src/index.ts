import * as fs from 'fs-extra';
import * as path from 'path';
import type { Options as PrettierOptions } from 'prettier';
import {
  PropertyAssignment,
  Node,
  forEachChild,
  createSourceFile,
  SyntaxKind,
} from 'typescript';
import * as prettier from 'prettier';

import { FileContext } from './replaceContexts';
import { HandledOpt, ReplacerOpt, LocaleTypes } from './types';
import { ScriptTarget } from 'typescript';
import {
  GlobalI18nFormatter,
  HookI18nFormatter,
  I18nFormatter,
} from './formatter';

export { GlobalI18nFormatter, HookI18nFormatter, I18nFormatter };
export default class I18nReplacer {
  public static createI18nReplacer({
    localesToGenerate,
    localeToReplace,
    tsTarget,
    I18nFormatter,
    workingDir,
    filesOrDirsToReplace,
    fileFilter,
    prettierConfig,
    outputToNewDir,
    generatedFilesDir,
  }: ReplacerOpt = {}): I18nReplacer {
    let usedTargetDir = workingDir ?? process.cwd();
    const handledOpt: HandledOpt = {
      workingDir: usedTargetDir,
      localeToReplace: localeToReplace ?? 'zh-cn',
      localesToGenerate: localesToGenerate ?? ['en-us', 'zh-cn'],
      generatedFilesDir: generatedFilesDir ?? 'i18n',
      tsTarget:
        tsTarget ??
        I18nReplacer.getTypeScriptTargetCompilerOption(usedTargetDir),
      I18nFormatter: I18nFormatter ?? GlobalI18nFormatter,
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

  public readonly i18nFormatter: I18nFormatter;
  private constructor(public readonly opt: HandledOpt) {
    this.langDir = path.join(this.opt.workingDir, this.opt.generatedFilesDir);
    this.i18nFormatter = new opt.I18nFormatter();
  }

  private getIntlIdMapMessage(locale: LocaleTypes) {
    const defaultLocaleFile = path.join(this.langDir, locale + '.ts');
    let intlIdMapMessage: Record<string, string> = {};
    if (fs.existsSync(defaultLocaleFile)) {
      const file = fs.readFileSync(defaultLocaleFile, 'utf-8');
      const source = createSourceFile(
        defaultLocaleFile,
        file,
        this.opt.tsTarget,
        true
      );
      intlIdMapMessage =
        I18nReplacer.intlIdMapMessageFromAstNodeRecursively(source);
    }
    return intlIdMapMessage;
  }

  public replace() {
    const intlIdMapDefaultMessage: Record<string, string> =
      this.getIntlIdMapMessage(this.opt.localeToReplace);

    this.i18nFormatter.setMessageMapIntlId(
      Object.entries<string>(intlIdMapDefaultMessage).reduce(
        (messageMapIntlId: Record<string, string>, [intlId, message]) => {
          if (!messageMapIntlId[message]) {
            messageMapIntlId[message] = intlId;
          }
          return messageMapIntlId;
        },
        {}
      )
    );

    if (this.opt.outputToNewDir) {
      fs.ensureDirSync(this.opt.outputToNewDir);
    }

    if (!fs.existsSync(this.langDir)) {
      fs.ensureDirSync(this.langDir);
    }

    const newIntlMapMessages = this.replaceTargetLocaleWithMessageRecursively(
      this.opt.filesOrDirsToReplace
    );

    Object.assign(intlIdMapDefaultMessage, newIntlMapMessages);

    this.opt.localesToGenerate.forEach((locale) => {
      let currentIntlIdMapMessage = intlIdMapDefaultMessage;
      if (locale !== this.opt.localeToReplace) {
        currentIntlIdMapMessage = this.getIntlIdMapMessage(locale);
        Object.keys(intlIdMapDefaultMessage).forEach((intlId) => {
          if (currentIntlIdMapMessage[intlId] === undefined) {
            currentIntlIdMapMessage[intlId] = intlIdMapDefaultMessage[intlId];
          }
        });
      }

      this.formatAndWrite(
        path.join(this.langDir, locale + '.ts'),
        this.i18nFormatter.generateMessageFile(currentIntlIdMapMessage)
      );
    });

    const templateDist = path.join(
      this.opt.workingDir,
      this.opt.generatedFilesDir,
      'index.ts' + (this.i18nFormatter instanceof HookI18nFormatter ? 'x' : '')
    );

    if (!fs.existsSync(templateDist)) {
      this.formatAndWrite(
        templateDist,
        this.i18nFormatter.entryFile(
          this.opt.localesToGenerate,
          this.opt.localeToReplace
        )
      );
    }

    this.formatAndWrite(
      path.join(this.opt.workingDir, this.opt.generatedFilesDir, 'types.ts'),
      this.i18nFormatter.generateTypeFile(
        this.opt.localesToGenerate,
        Object.keys(intlIdMapDefaultMessage).sort()
      )
    );

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
      'warning: ' +
        text +
        '\nfile: ' +
        fileContext.fileLocate +
        ' start:' +
        start +
        ' end: ' +
        end +
        '\ntext: |' +
        fileContext.file.slice(Math.max(0, start - 3), start) +
        '[' +
        fileContext.file.slice(start, end).replace(/(\n)+/g, '\\n') +
        ']' +
        fileContext.file.slice(end + 1, end + 4).replace(/(\n)+/g, '\\n') +
        '|\n'
    );
  }

  public includesTargetLocale(text: string) {
    return this.localeMapReg[this.opt.localeToReplace].test(text);
  }

  private localeMapReg: Record<LocaleTypes, RegExp> = {
    'en-us': /[a-z]+/i,
    'zh-cn': /[\u4e00-\u9fa5]+/,
  };

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

  private static intlIdMapMessageFromAstNodeRecursively(
    astNode: Node,
    intlIdMapMessage: Record<string, string> = {}
  ) {
    if (astNode.kind === SyntaxKind.PropertyAssignment) {
      const name = (astNode as PropertyAssignment).name.getText();
      const value = (astNode as PropertyAssignment).initializer.getText();
      intlIdMapMessage[name] = value.replace(/(^['"])|(['"]$)/g, '');
    }
    forEachChild(astNode, function (n) {
      I18nReplacer.intlIdMapMessageFromAstNodeRecursively(n, intlIdMapMessage);
    });
    return intlIdMapMessage;
  }

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

    if (/(en-us)|(zh-cn)\.ts/.test(name)) {
      return false;
    }

    if (this.opt.fileFilter) {
      return this.opt.fileFilter(name);
    }

    return true;
  };

  private replaceTargetLocaleWithMessageRecursively(
    filesOrDirsToReplace: string[]
  ): Record<string, string> {
    filesOrDirsToReplace
      .filter(this.fileFilter)
      .sort()
      .forEach((fileOrDir) => {
        if (fs.lstatSync(fileOrDir).isDirectory()) {
          const dir = fileOrDir;
          this.replaceTargetLocaleWithMessageRecursively(
            fs.readdirSync(dir).map((d) => path.join(dir, d))
          );
          return;
        }

        const fileLocation = fileOrDir;

        const file = fs.readFileSync(fileLocation, 'utf-8');
        const node = createSourceFile(
          fileLocation,
          file,
          this.opt.tsTarget,
          true
        );

        let fileContext: FileContext = new FileContext({
          node,
          file,
          fileLocate: fileLocation,
          i18nReplacer: this,
        });
        let replacedText = '';

        try {
          replacedText = fileContext.generateMessage();
        } catch (error: any) {
          if (error.message) {
            error.message = '@ ' + fileLocation + ' ' + error.message;
          }
          console.error(error);
        } finally {
          fileContext.clear();
        }

        if (!replacedText) {
          return this.i18nFormatter.getNewIntlMapMessages();
        }

        if (this.opt.outputToNewDir) {
          this.formatAndWrite(
            path.join(this.opt.outputToNewDir, path.basename(fileLocation)),
            replacedText
          );
          console.log(
            fileLocation +
              ' write to ' +
              this.opt.outputToNewDir +
              ' successful! 😃'
          );
        } else {
          this.formatAndWrite(fileLocation, replacedText);
          console.log(fileLocation + ' rewrite successful! 😃');
        }
      });
    return this.i18nFormatter.getNewIntlMapMessages();
  }
}

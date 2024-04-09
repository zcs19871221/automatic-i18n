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
import { HandledOpt, ReplacerOpt, localeTypes } from './types';
import { ScriptTarget } from 'typescript';
import { GlobalI18nFormatter, I18nFormatter } from './formatter';

export class I18nReplacer {
  public static createI18nReplacer({
    localesToGenerate,
    localeToReplace,
    tsTarget,
    I18nFormatter,
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
    this.langDir = path.join(this.opt.targetDir, this.opt.i18nDirName);
    this.i18nFormatter = new opt.I18nFormatter();
  }

  public replace() {
    let intlIds: string[] | undefined;
    let intlIdMapMessage: Record<string, string> = {};
    this.forEachMessageFiles(
      ({ intlIdMapMessage: currentIntlIdMapMessage, targetLocale }) => {
        const currentIntlIds = Object.keys(currentIntlIdMapMessage);
        if (!intlIds) {
          intlIds = currentIntlIds;
        } else if (
          intlIds.join(',') !== Object.keys(currentIntlIdMapMessage).join(',')
        ) {
          throw new Error(
            this.opt.localesToGenerate.join(',') + ' exits different keys'
          );
        }
        if (targetLocale) {
          intlIdMapMessage = currentIntlIdMapMessage;
        }
      }
    );

    intlIds = undefined;
    this.i18nFormatter.setMessageMapIntlId(
      Object.entries<string>(intlIdMapMessage).reduce(
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

    const newIntlMapMessages = this.replaceTargetLocaleWithMessageRecursively(
      this.opt.filesOrDirsToReplace
    );

    if (Object.keys(newIntlMapMessages).length > 0) {
      this.forEachMessageFiles(
        ({ intlIdMapMessage, fileLocate, targetLocale }) => {
          Object.assign(intlIdMapMessage, newIntlMapMessages);
          if (targetLocale) {
            intlIds = Object.keys(intlIdMapMessage).sort();
          }
          this.formatAndWrite(
            fileLocate,
            this.i18nFormatter.generateMessageFile(intlIdMapMessage)
          );
        }
      );
    }

    const templateDist = path.join(
      this.opt.targetDir,
      this.opt.i18nDirName,
      'index.ts'
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
      path.join(this.opt.targetDir, this.opt.i18nDirName, 'types.ts'),
      this.i18nFormatter.generateTypeFile(this.opt.localesToGenerate, intlIds!)
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

  private forEachMessageFiles(
    func: (args: {
      intlIdMapMessage: Record<string, string>;
      fileLocate: string;
      locale: localeTypes;
      targetLocale: boolean;
    }) => void
  ) {
    this.opt.localesToGenerate.forEach((locale) => {
      const fileLocate = path.join(this.langDir, locale + '.ts');

      let intlIdMapMessage: Record<string, string> = {};
      if (fs.existsSync(fileLocate)) {
        const source = createSourceFile(
          fileLocate,
          fs.readFileSync(fileLocate, 'utf-8'),
          this.opt.tsTarget,
          true
        );
        intlIdMapMessage =
          I18nReplacer.intlIdMapMessageFromAstNodeRecursively(source);
      }

      func({
        intlIdMapMessage,
        fileLocate,
        locale,
        targetLocale: locale === this.opt.localeToReplace,
      });
    });
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

  private static intlIdMapMessageFromAstNodeRecursively(
    astNode: Node,
    intlIdMapMessage: Record<string, string> = {}
  ) {
    if (astNode.kind === SyntaxKind.PropertyAssignment) {
      const name = (astNode as PropertyAssignment).name.getText();
      const value = (astNode as PropertyAssignment).initializer.getText();
      intlIdMapMessage[name] = value.replace(/(^['"])|(['"]$)/g, '');
    }
    forEachChild(astNode, (n) =>
      I18nReplacer.intlIdMapMessageFromAstNodeRecursively(n, intlIdMapMessage)
    );
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

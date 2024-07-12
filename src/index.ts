import * as fs from 'fs-extra';
import * as path from 'path';
import ts, {
  PropertyAssignment,
  Node,
  forEachChild,
  createSourceFile,
  SyntaxKind,
} from 'typescript';
import * as prettier from 'prettier';

import { FileContext } from './replaceContexts';
import {
  HandledOpt,
  ReplacerOpt,
  LocaleTypes,
  I18nFormatterCtr,
} from './types';
import { ScriptTarget } from 'typescript';
import {
  GlobalI18nFormatter,
  HookI18nFormatter,
  I18nFormatter,
} from './formatter';

export { GlobalI18nFormatter, HookI18nFormatter, I18nFormatter };

export const getAbsolutePath = (p: string) => {
  let absolutePath = '';
  if (p.startsWith('/') || p.match(/[a-z]+:/i)) {
    absolutePath = p;
  } else {
    absolutePath = path.join(process.cwd(), p);
  }

  return absolutePath;
};

export const excludeNodeModule = (fileOrDirName: string) => {
  if (fileOrDirName.includes('node_modules') || fileOrDirName.startsWith('.')) {
    return false;
  }

  return true;
};

export const onlyTJsxFiles = (fileOrDirName: string, directory: boolean) => {
  if (!directory && !fileOrDirName.match(/[tj]sx?$/)) {
    return false;
  }

  return true;
};

export const initParams = ({
  targets = [process.cwd()],
  distLocaleDir = path.join(process.cwd(), 'i18n'),
  localeToReplace = 'zh-cn',
  localesToGenerate = ['zh-cn', 'en-us'],
  I18nFormatterClass,
  I18nFormatterClassAlias,
  outputToNewDir,
  filters = [onlyTJsxFiles, excludeNodeModule],
  excludes,
  debug = false,
}: ReplacerOpt) => {
  targets = targets.map((t) => getAbsolutePath(t));
  const notExists = targets.filter((t) => !fs.existsSync(t));
  if (notExists.length > 0) {
    throw new Error('can not find target fileOrDirs: ' + notExists.join(','));
  }

  distLocaleDir = getAbsolutePath(distLocaleDir);
  if (!fs.statSync(distLocaleDir).isDirectory()) {
    throw new Error('distLocaleDir should be directory. ' + distLocaleDir);
  }
  if (!fs.existsSync(distLocaleDir)) {
    fs.ensureDirSync(distLocaleDir);
  }

  let I18nFormatter: I18nFormatterCtr = HookI18nFormatter;

  if (I18nFormatterClass) {
    I18nFormatter = I18nFormatterClass;
  } else if (I18nFormatterClassAlias == 'global') {
    I18nFormatter = GlobalI18nFormatter;
  } else if (I18nFormatterClassAlias == 'hook') {
    I18nFormatter = HookI18nFormatter;
  }

  if (excludes) {
    filters.push(
      (fileOrDirName) => !excludes.some((ex) => ex === fileOrDirName)
    );
  }

  filters.push((fileOrDirName, directory) =>
    fileOrDirName === distLocaleDir ? false : true
  );

  const handledOpt: HandledOpt = {
    targets,
    distLocaleDir,
    localeToReplace,
    localesToGenerate: [...new Set([localeToReplace, ...localesToGenerate])],
    I18nFormatter,
    filters,
    debug,
    outputToNewDir,
    typescriptTarget: getScriptTarget(distLocaleDir),
  };

  return handledOpt;
};

export const getScriptTarget = (file: string): ScriptTarget => {
  const configFileName = ts.findConfigFile(
    file,
    ts.sys.fileExists,
    'tsconfig.json'
  );
  if (configFileName) {
    const configFile = ts.readConfigFile(configFileName, ts.sys.readFile);
    const compilerOptions = ts.parseJsonConfigFileContent(
      configFile.config,
      ts.sys,
      './'
    );
    if (compilerOptions.options.target !== undefined) {
      return compilerOptions.options.target;
    }
  }
  return ScriptTarget.ES2015;
};

export default class I18nReplacer {
  public static createI18nReplacer(opt: ReplacerOpt = {}): I18nReplacer {
    return new I18nReplacer(initParams(opt));
  }

  private warnings: Set<string> = new Set();
  private ignoreComment = '@ignore';

  public readonly i18nFormatter: I18nFormatter;
  private constructor(public readonly opt: HandledOpt) {
    this.i18nFormatter = new opt.I18nFormatter();
  }

  private getIntlIdMapMessage(locale: LocaleTypes) {
    const defaultLocaleFile = path.join(this.opt.distLocaleDir, locale + '.ts');
    let intlIdMapMessage: Record<string, string> = {};
    if (fs.existsSync(defaultLocaleFile)) {
      const file = fs.readFileSync(defaultLocaleFile, 'utf-8');
      const source = createSourceFile(
        defaultLocaleFile,
        file,
        this.opt.typescriptTarget,
        true
      );
      intlIdMapMessage =
        I18nReplacer.intlIdMapMessageFromAstNodeRecursively(source);
    }
    return intlIdMapMessage;
  }

  public replace() {
    this.opt.prettierOptions = {
      singleQuote: true,
      tabWidth: 2,
    };

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

    if (!fs.existsSync(this.opt.distLocaleDir)) {
      fs.ensureDirSync(this.opt.distLocaleDir);
    }

    const newIntlMapMessages = this.replaceTargetLocaleWithMessageRecursively(
      this.opt.targets
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
        path.join(this.opt.distLocaleDir, locale + '.ts'),
        this.i18nFormatter.generateMessageFile(currentIntlIdMapMessage)
      );
    });

    const templateDist = path.join(
      this.opt.distLocaleDir,
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
      path.join(this.opt.distLocaleDir, 'types.ts'),
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
    if (this.opt.prettierOptions) {
      file = prettier.format(file, this.opt.prettierOptions);
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

  private replaceTargetLocaleWithMessageRecursively(
    filesOrDirsToReplace: string[]
  ): Record<string, string> {
    filesOrDirsToReplace
      .sort()
      .map((f) => [f, fs.lstatSync(f).isDirectory()] as const)
      .filter((f) => this.opt.filters.every((filter) => filter(f[0], f[1])))
      .forEach(([fileOrDir, directory]) => {
        if (directory) {
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
          this.opt.typescriptTarget,
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

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
import { Options as PrettierOptions } from 'prettier';

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
  if (
    fileOrDirName.includes('node_modules') ||
    path.basename(fileOrDirName).startsWith('.')
  ) {
    return false;
  }

  return true;
};

const resolvePrettierConfig = async (p: string) => {
  return await prettier.resolveConfig(p);
};

export const onlyTJsxFiles = (fileOrDirName: string, directory: boolean) => {
  if (!directory && !fileOrDirName.match(/\.[tj]sx?$/)) {
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
  filters = [excludeNodeModule, onlyTJsxFiles],
  excludes,
  debug = false,
}: ReplacerOpt) => {
  targets = targets.map((t) => getAbsolutePath(t));
  const notExists = targets.filter((t) => !fs.existsSync(t));
  if (notExists.length > 0) {
    throw new Error('can not find target fileOrDirs: ' + notExists.join(','));
  }

  distLocaleDir = getAbsolutePath(distLocaleDir);
  if (!fs.existsSync(distLocaleDir)) {
    fs.ensureDirSync(distLocaleDir);
  }
  if (!fs.statSync(distLocaleDir).isDirectory()) {
    throw new Error('distLocaleDir should be directory. ' + distLocaleDir);
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
  };

  if (debug) {
    console.debug(handledOpt);
  }
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
        getScriptTarget(defaultLocaleFile),
        true
      );
      intlIdMapMessage =
        I18nReplacer.intlIdMapMessageFromAstNodeRecursively(source);
    }
    return intlIdMapMessage;
  }

  public async replace() {
    const startTime = Date.now();
    await this.doReplace();
    if (this.opt.debug) {
      console.log('usedTime: ' + (Date.now() - startTime) / 1000 + 's');
    }
  }
  public async doReplace() {
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

    await this.replaceTargetLocaleWithMessageRecursively(
      await Promise.all(
        this.opt.targets.map(async (t) => {
          const config = await resolvePrettierConfig(t);
          return {
            prettierOptions: config,
            name: t,
          };
        })
      )
    );

    const newIntlMapMessages = this.i18nFormatter.getNewIntlMapMessages();

    Object.assign(intlIdMapDefaultMessage, newIntlMapMessages);

    this.opt.localesToGenerate.forEach(async (locale) => {
      let currentIntlIdMapMessage = intlIdMapDefaultMessage;
      if (locale !== this.opt.localeToReplace) {
        currentIntlIdMapMessage = this.getIntlIdMapMessage(locale);
        Object.keys(intlIdMapDefaultMessage).forEach((intlId) => {
          if (currentIntlIdMapMessage[intlId] === undefined) {
            currentIntlIdMapMessage[intlId] = intlIdMapDefaultMessage[intlId];
          }
        });
      }

      await this.formatAndWrite(
        path.join(this.opt.distLocaleDir, locale + '.ts'),
        this.i18nFormatter.generateMessageFile(currentIntlIdMapMessage)
      );
    });

    const templateDist = path.join(
      this.opt.distLocaleDir,
      'index.ts' + (this.i18nFormatter instanceof HookI18nFormatter ? 'x' : '')
    );

    if (!fs.existsSync(templateDist)) {
      await this.formatAndWrite(
        templateDist,
        this.i18nFormatter.entryFile(
          this.opt.localesToGenerate,
          this.opt.localeToReplace
        )
      );
    }

    await this.formatAndWrite(
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

  private async formatAndWrite(
    dist: string,
    file: string,
    prettierOptions?: PrettierOptions | null
  ) {
    if (prettierOptions === undefined) {
      prettierOptions = await resolvePrettierConfig(dist);
    }

    if (prettierOptions) {
      if (!prettierOptions.parser) {
        prettierOptions.parser = 'typescript';
      }
      file = prettier.format(file, prettierOptions);
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

  private async replaceTargetLocaleWithMessageRecursively(
    filesOrDirsToReplace: {
      name: string;
      prettierOptions: PrettierOptions | null;
    }[]
  ) {
    const filteredAndSorted = filesOrDirsToReplace
      .map(
        (
          f
        ): {
          name: string;
          prettierOptions: PrettierOptions | null;
          directory: boolean;
        } => ({
          ...f,
          directory: fs.lstatSync(f.name).isDirectory(),
        })
      )
      .filter((f) =>
        this.opt.filters.every((filter) => filter(f.name, f.directory))
      );

    for (const {
      name: fileOrDir,
      directory,
      prettierOptions,
    } of filteredAndSorted) {
      if (directory) {
        const dir = fileOrDir;
        await this.replaceTargetLocaleWithMessageRecursively(
          fs
            .readdirSync(dir)
            .map((d) => path.join(dir, d))
            .sort()
            .map((n) => ({
              name: n,
              prettierOptions,
            }))
        );
        continue;
      }

      const fileLocation = fileOrDir;

      const file = fs.readFileSync(fileLocation, 'utf-8');
      const node = createSourceFile(
        fileLocation,
        file,
        getScriptTarget(fileLocation),
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
        continue;
      }

      if (this.opt.outputToNewDir) {
        await this.formatAndWrite(
          path.join(this.opt.outputToNewDir, path.basename(fileLocation)),
          replacedText,
          prettierOptions
        );
        console.log(
          fileLocation +
            ' write to ' +
            this.opt.outputToNewDir +
            ' successful! 😃'
        );
      } else {
        await this.formatAndWrite(fileLocation, replacedText, prettierOptions);
        console.log(fileLocation + ' rewrite successful! 😃');
      }
    }
  }
}

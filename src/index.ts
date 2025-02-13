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

import { ReplaceContext, Info } from './ReplaceContext';
import { HandlerOption, ReplacerOpt, LocaleTypes, TargetOpt } from './types';
import { ScriptTarget } from 'typescript';
import { DefaultI18nFormatter, I18nFormatter } from './formatter';
import tsNodeHandlers from './tsNodeHandlers';
import { handleNode } from './tsNodeHandlers/TsNodeHandler';

export { I18nFormatter };

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

export const defaultTargets = () => [process.cwd()];

export const defaultDistLocaleDir = () => path.join(process.cwd(), 'i18n');

export const defaultLocaleToReplace = 'zh-cn';
export const defaultLocalesToGenerate: LocaleTypes[] = ['zh-cn', 'en-us'];

export const initParams = ({
  targets = defaultTargets(),
  distLocaleDir = defaultDistLocaleDir(),
  localeToReplace = defaultLocaleToReplace,
  localesToGenerate = defaultLocalesToGenerate,
  outputToNewDir,
  filters = [excludeNodeModule, onlyTJsxFiles],
  excludes,
  meaningKey = false,
  global: hook = false,
  debug = false,
  uniqIntlKey = false,
  I18nFormatter = DefaultI18nFormatter,
}: ReplacerOpt) => {
  targets = targets.map((t) => path.resolve(t));
  const notExists = targets.filter((t) => !fs.existsSync(t));
  if (notExists.length > 0) {
    throw new Error('can not find target fileOrDirs: ' + notExists.join(','));
  }

  distLocaleDir = path.resolve(distLocaleDir);
  if (!fs.existsSync(distLocaleDir)) {
    fs.ensureDirSync(distLocaleDir);
  }
  if (!fs.statSync(distLocaleDir).isDirectory()) {
    throw new Error('distLocaleDir should be directory. ' + distLocaleDir);
  }

  if (excludes) {
    filters.push((fileOrDirName) =>
      excludes.every((ex) => ex !== path.basename(fileOrDirName))
    );
  }

  filters.push((fileOrDirName) =>
    fileOrDirName === distLocaleDir ? false : true
  );

  const HandlerOption: HandlerOption = {
    global: hook,
    uniqIntlKey,
    targets,
    distLocaleDir,
    localeToReplace,
    localesToGenerate: [...new Set([localeToReplace, ...localesToGenerate])],
    I18nFormatter,
    filters,
    debug,
    outputToNewDir,
    meaningKey,
  };

  if (debug) {
    console.debug(HandlerOption);
  }
  return HandlerOption;
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
  private constructor(public readonly opt: HandlerOption) {
    this.i18nFormatter = new opt.I18nFormatter();
  }

  private oldKeyMapNewKey: Record<string, string> = {};

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

  public getOldKeyMapNewKey() {
    return this.oldKeyMapNewKey;
  }

  public async replace() {
    const startTime = Date.now();
    await this.doReplace();
    if (this.opt.debug) {
      console.log('usedTime: ' + (Date.now() - startTime) / 1000 + 's');
    }
  }

  public async doReplace() {
    const map: Record<LocaleTypes, Record<string, string>> = {} as any;
    this.opt.localesToGenerate.forEach((locale) => {
      map[locale] = this.getIntlIdMapMessage(locale);
    });
    this.oldKeyMapNewKey = {};
    Object.entries(map['en-us']).forEach(([key, message]) => {
      if (
        I18nFormatter.isAutomaticGeneratedKey(key) &&
        this.localeMapReg['en-us'](message) &&
        this.opt.meaningKey
      ) {
        let meaningKey = this.englishToVariableName(message);

        let i = 1;
        let newKey = meaningKey;
        while (map['en-us'][newKey] !== undefined) {
          newKey = meaningKey + '_' + i++;
        }
        this.oldKeyMapNewKey[key] = newKey;
      }
    });

    Object.entries(this.oldKeyMapNewKey).forEach(([oldKey, newKey]) => {
      Object.entries(map).forEach(([locale, keyMapMessage]) => {
        keyMapMessage[newKey] = keyMapMessage[oldKey];
        delete keyMapMessage[oldKey];
        map[locale as LocaleTypes] = keyMapMessage;
      });
    });

    Object.entries(map)
      .filter((entry) => entry[0] !== this.opt.localeToReplace)
      .map(([_locale, keyMapMessage]) => {
        Object.keys(map[this.opt.localeToReplace]).forEach((key) => {
          if (keyMapMessage[key] == undefined) {
            keyMapMessage[key] = map[this.opt.localeToReplace][key];
          }
        });
      });

    this.i18nFormatter.setMessageMapIntlId(
      Object.entries<string>(map[this.opt.localeToReplace]).reduce(
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

    fs.ensureDirSync(this.opt.distLocaleDir);

    const distPrettierOptions = await resolvePrettierConfig(
      path.join(this.opt.distLocaleDir, 'index.ts')
    );

    await this.replaceTargetLocaleWithMessageRecursively(
      await Promise.all(
        this.opt.targets.map(async (target) => {
          const config = await resolvePrettierConfig(target);
          const scriptTarget = getScriptTarget(target);
          return {
            prettierOptions: config,
            name: target,
            scriptTarget,
          };
        })
      )
    );

    const newIntlMapMessages = this.i18nFormatter.getNewIntlMapMessages();

    await Promise.all(
      Object.entries(map).map(([locale, keyMapMessage]) => {
        Object.assign(keyMapMessage, newIntlMapMessages);

        return this.formatAndWrite(
          path.join(this.opt.distLocaleDir, locale + '.ts'),
          this.i18nFormatter.generateMessageFile(keyMapMessage),
          distPrettierOptions
        );
      })
    );

    const templateDist = path.join(
      this.opt.distLocaleDir,
      'index.ts' +
        (this.i18nFormatter instanceof DefaultI18nFormatter ? 'x' : '')
    );

    if (!fs.existsSync(templateDist)) {
      await this.formatAndWrite(
        templateDist,

        this.i18nFormatter.entryFile(
          this.opt.localesToGenerate,
          this.opt.localeToReplace
        ),
        distPrettierOptions
      );
    }

    await this.formatAndWrite(
      path.join(this.opt.distLocaleDir, 'types.ts'),
      this.i18nFormatter.generateTypeFile(
        this.opt.localesToGenerate,
        I18nFormatter.sortKeys(map[this.opt.localeToReplace])
      ),
      distPrettierOptions
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
    info,
  }: {
    start: number;
    end: number;
    text: string;
    info: Info;
  }) {
    this.warnings.add(
      'warning: ' +
        text +
        '\nfile: ' +
        info.fileName +
        ' start:' +
        start +
        ' end: ' +
        end +
        '\ntext: |' +
        info.file.slice(Math.max(0, start - 3), start) +
        '[' +
        info.file.slice(start, end).replace(/(\n)+/g, '\\n') +
        ']' +
        info.file.slice(end + 1, end + 4).replace(/(\n)+/g, '\\n') +
        '|\n'
    );
  }

  public includesTargetLocale(text: string) {
    return this.localeMapReg[this.opt.localeToReplace](text);
  }

  private localeMapReg: Record<LocaleTypes, (str: string) => boolean> = {
    'en-us': (str) => /[a-z]+/i.test(str),
    'zh-cn': (str) => /[\u4e00-\u9fa5]+/.test(str),
  };

  private englishToVariableName(text: string) {
    text = text.trim();
    text = text
      .replace(/[^a-z\s]/gi, '')
      .replace(/^\s+/gi, '')
      .replace(/\s+([a-z])/gi, (_matched: string, firstLetter: string) => {
        return firstLetter.toUpperCase();
      })
      .replace(/\s/g, '');
    if (text.length > 30) {
      text = text.slice(0, 30) + '_';
    }
    return text;
  }

  private async formatAndWrite(
    dist: string,
    file: string,
    prettierOptions: PrettierOptions | null
  ) {
    if (prettierOptions) {
      if (!prettierOptions.parser) {
        prettierOptions.parser = 'typescript';
      }
      try {
        file = prettier.format(file, prettierOptions);
      } catch (error: any) {
        console.error(
          'fail to format and write to file: ' + dist + ' try to direct write'
        );
        fs.writeFileSync(dist, file);
      }
    }

    return fs.writeFileSync(dist, file);
  }

  private static intlIdMapMessageFromAstNodeRecursively(
    astNode: Node,
    intlIdMapMessage: Record<string, string> = {}
  ) {
    if (astNode.kind === SyntaxKind.PropertyAssignment) {
      let name = (astNode as PropertyAssignment).name.getText();
      if (
        ["'", '"'].some(
          (quote) => name.startsWith(quote) && name.endsWith(quote)
        )
      ) {
        name = name.slice(1, -1);
      }
      const value = (astNode as PropertyAssignment).initializer.getText();
      intlIdMapMessage[name] = value.replace(/(^['"])|(['"]$)/g, '');
    }
    forEachChild(astNode, function (n) {
      I18nReplacer.intlIdMapMessageFromAstNodeRecursively(n, intlIdMapMessage);
    });
    return intlIdMapMessage;
  }

  private async replaceTargetLocaleWithMessageRecursively(
    filesOrDirsToReplace: TargetOpt[]
  ) {
    const filteredAndSorted = filesOrDirsToReplace
      .map(
        (
          f
        ): TargetOpt & {
          directory: boolean;
        } => ({
          ...f,
          directory: fs.lstatSync(f.name).isDirectory(),
        })
      )
      .sort((a, b) => a.name.localeCompare(b.name))
      .filter((f) =>
        this.opt.filters.every((filter) => filter(f.name, f.directory))
      );

    for (const {
      name: fileOrDir,
      directory,
      prettierOptions,
      scriptTarget,
    } of filteredAndSorted) {
      if (directory) {
        const dir = fileOrDir;
        await this.replaceTargetLocaleWithMessageRecursively(
          fs.readdirSync(dir).map((d) => ({
            name: path.join(dir, d),
            prettierOptions,
            scriptTarget,
          }))
        );
        continue;
      }

      const fileLocation = fileOrDir;

      let file = fs.readFileSync(fileLocation, 'utf-8');

      const node = createSourceFile(fileLocation, file, scriptTarget, true);

      const info: Info = {
        file,
        fileName: fileLocation,
        i18nReplacer: this as I18nReplacer,
        imports: new Set(),
        requiredImports: {},
        globalContext: [],
      };
      let fileContext: null | ReplaceContext = null;
      try {
        fileContext = handleNode({
          node,
          info: info,
          tsNodeHandlers,
        })[0];
      } catch (error: any) {
        if (error.message) {
          error.message = '@ ' + fileLocation + ' ' + error.message;
        }
        console.error(error);
      }

      if (!fileContext || !fileContext.newText) {
        continue;
      }

      if (this.opt.outputToNewDir) {
        await this.formatAndWrite(
          path.join(this.opt.outputToNewDir, path.basename(fileLocation)),
          fileContext.newText,
          prettierOptions
        );
        console.log(
          fileLocation +
            ' write to ' +
            this.opt.outputToNewDir +
            ' successful! 😃'
        );
      } else {
        await this.formatAndWrite(
          fileLocation,
          fileContext.newText,
          prettierOptions
        );
        console.log(fileLocation + ' rewrite successful! 😃');
      }
    }
  }
}

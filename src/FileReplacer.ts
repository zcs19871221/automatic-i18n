import { Node, forEachChild, createSourceFile } from 'typescript';
import { BundleReplacer } from './BundleReplacer';
import { Opt } from './types';
import { ReplaceContext } from './replaceContexts/ReplaceContext';
import { FileContext as FileContext } from './replaceContexts/FileContext';
import tsNodeHandlers from './tsNodeHandlers';

interface Warning {
  start: number;
  end: number;
  text: string;
}

export class FileReplacer {
  private property = 'intl';
  private fileContext: FileContext;
  public static ignoreWarningKey = '@ignore';

  public hasImportedI18nModules: boolean = false;

  constructor(
    private readonly fileLocate: string,
    public readonly bundleReplacer: BundleReplacer,
    public readonly opt: Opt,
    public file: string
  ) {
    const node = createSourceFile(this.fileLocate, file, opt.tsTarget, true);

    this.fileContext = new FileContext({
      node,
      replacer: this,
      start: 0,
      end: file.length,
    });
  }

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
    return `${this.bundleReplacer.exportName}.${this.property}.formatMessage({id: '${intlId}'}${paramsString})`;
  }

  private createImportStatement() {
    return `import { ${this.bundleReplacer.exportName} } from '${this.opt.importPath}';\n`;
  }

  public getOrCreateIntlId(localeText: string) {
    localeText = localeText.replace(/\n/g, '\\n');
    let intlId = '';
    const localeTextMappingKey = this.bundleReplacer.localeTextMappingKey;
    if (localeTextMappingKey[localeText]) {
      intlId = localeTextMappingKey[localeText];
    } else {
      do {
        intlId = `key${String(this.bundleReplacer.key++).padStart(4, '0')}`;
      } while (Object.values(localeTextMappingKey).includes(intlId));
      localeTextMappingKey[localeText] = intlId;
    }

    return intlId;
  }

  public replace() {
    try {
      let replacedText = this.fileContext.generateNewText();
      if (replacedText && !this.hasImportedI18nModules) {
        const tsUncheckCommentMatched = this.file.match(
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
      return replacedText;
    } catch (error: any) {
      if (error.message) {
        error.message = '@ ' + this.fileLocate + ' ' + error.message;
      }
      console.error(error);
    } finally {
      this.fileContext.clear();
      this.file = '';
    }
  }

  public handleChildren(node: Node, parentContext?: ReplaceContext) {
    forEachChild(node, (child) => {
      const targetHandler = tsNodeHandlers.filter((tsNodeHandler) =>
        tsNodeHandler.match(child, this, parentContext)
      );
      if (targetHandler.length > 1) {
        throw new Error('matched more then 1 ');
      }
      if (targetHandler.length === 1) {
        targetHandler[0].handle(child, this, parentContext);
      } else {
        this.handleChildren(child, parentContext);
      }
    });
  }

  public ignore(node: Node) {
    return node.getFullText().includes(FileReplacer.ignoreWarningKey);
  }

  public addWarningInfo({ start, end, text }: Warning) {
    this.bundleReplacer.warnings.add(
      text +
        '\nfile at: ' +
        this.fileLocate +
        '\ntext: ' +
        this.file.slice(Math.max(0, start - 3), start) +
        '【' +
        this.file.slice(start, end) +
        '】' +
        this.file.slice(end + 1, end + 4) +
        '\n'
    );
  }

  public includesTargetLocale(text: string) {
    return /[\u4e00-\u9fa5]+/g.test(text);
  }
}

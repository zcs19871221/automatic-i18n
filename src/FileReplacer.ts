import * as ts from 'typescript';
import * as fs from 'fs-extra';
import * as path from 'path';
import { SyntaxKind, TemplateExpression } from 'typescript';
import { BundleReplacer } from './BundleReplacer';
import { Opt } from './types';

export class FileReplacer {
  constructor(
    private readonly fileLocate: string,
    private readonly bundleReplacer: BundleReplacer,
    private readonly opt: Opt
  ) {
    this.file = fs.readFileSync(fileLocate, 'utf-8');
  }

  public replace() {
    try {
      this.extractLocales();
      this.replaceLocalesIfExists();
    } catch (error) {
      if (error.message) {
        error.message = '@ ' + this.fileLocate + ' ' + error.message;
      }
      console.error(error);
    } finally {
      this.clear();
    }
  }

  private static exportName = 'Locales';

  public static localeMapToken: string = `${FileReplacer.exportName}.`;

  private createImportStatement() {
    return `import { ${FileReplacer.exportName} } from '${this.opt.importPath}';\n`;
  }

  private positionToReplace: {
    startPos: number;
    endPos: number;
    newText: string;
  }[] = [];

  private pushPositionIfTargetLocale({
    start,
    end,
    localeToSearch,
    needTrim,
    formatter = (textKey: string) => textKey,
  }: {
    start: number;
    end: number;
    needTrim: boolean;
    localeToSearch: string;
    formatter?: (textKey: string) => string;
  }) {
    if (!this.includesTargetLocale(localeToSearch)) {
      return;
    }
    if (needTrim) {
      const needTrimStart = localeToSearch.match(/^[^\u4e00-\u9fa5a-zA-Z\d]+/);
      const needTrimEnd = localeToSearch.match(/[^\u4e00-\u9fa5a-zA-Z\d]+$/);
      if (needTrimStart !== null) {
        localeToSearch = localeToSearch.slice(needTrimStart[0].length);
        start = start + needTrimStart[0].length;
      }
      if (needTrimEnd !== null) {
        localeToSearch = localeToSearch.slice(
          0,
          localeToSearch.length - needTrimEnd[0].length
        );
        end = end - needTrimEnd[0].length;
      }
    }

    let textKey =
      this.bundleReplacer.getOrSetLocaleTextKeyIfAbsence(localeToSearch);
    textKey = formatter(textKey);

    this.positionToReplace.push({
      startPos: start,
      endPos: end,
      newText: textKey,
    });
  }

  private targetLocaleReg() {
    return /[\u4e00-\u9fa5]+/g;
  }
  private includesTargetLocale(text: string) {
    return this.targetLocaleReg().test(text);
  }

  private clear() {
    this.file = '';
    this.positionToReplace = [];
  }

  private file: string;

  private extractLocales() {
    const sourceFile = ts.createSourceFile(
      this.fileLocate,
      this.file,
      ts.ScriptTarget.ES2015,
      true
    );
    this.traverseAstAndExtractLocales(sourceFile);
  }

  private replaceLocalesIfExists() {
    if (this.positionToReplace.length === 0) {
      return;
    }

    const hasImportedI18nModules = this.file.includes(
      FileReplacer.localeMapToken
    );
    this.positionToReplace.sort((a, b) => b.startPos - a.startPos);
    let prevStart: number | null = null;
    this.positionToReplace.forEach(({ startPos, endPos, newText }) => {
      if (prevStart === null) {
        prevStart = startPos;
      } else if (endPos >= prevStart) {
        throw new Error(`error parse at ${prevStart}`);
      }
      this.file =
        this.file.slice(0, startPos) + newText + this.file.slice(endPos);
    });

    if (!hasImportedI18nModules) {
      this.file = this.createImportStatement() + this.file;
    }

    if (this.opt.fileReplaceOverwirte) {
      fs.writeFileSync(this.fileLocate, this.file);
      console.log(this.fileLocate + ' rewrite sucessful! 😃');
    } else {
      fs.writeFileSync(
        path.join(this.opt.fileReplaceDist, path.basename(this.fileLocate)),
        this.file
      );
      console.log(
        this.fileLocate +
          ' write to ' +
          this.opt.fileReplaceDist +
          ' sucessful! 😃'
      );
    }
  }

  private removeTextVariableSymobl(text: string) {
    return text.replace(/(^['"`])|(['"]$)/g, '');
  }

  private textKeyAddJsxVariableBacket(textKey: string) {
    return '{' + textKey + '}';
  }

  private traverseAstAndExtractLocales(node: ts.Node) {
    switch (node.kind) {
      // 字符串字面量: "你好" '大家' 以及jsx中的属性常量: <div name="张三"/>
      case SyntaxKind.StringLiteral:
        {
          if (node.parent.kind === ts.SyntaxKind.ImportDeclaration) {
            return;
          }
          this.pushPositionIfTargetLocale({
            start: node.getStart(),
            end: node.getEnd(),
            localeToSearch: this.removeTextVariableSymobl(node.getText()),
            formatter: (textKey: string) => {
              if (node.parent.kind === SyntaxKind.JsxAttribute) {
                return this.textKeyAddJsxVariableBacket(textKey);
              }
              return textKey;
            },
            needTrim: false,
          });
        }
        break;
      // html文本标签中字面量<div>大家好</div>
      case SyntaxKind.JsxText:
        this.pushPositionIfTargetLocale({
          start: node.getStart(),
          end: node.getEnd(),
          localeToSearch: node.getText(),
          formatter: this.textKeyAddJsxVariableBacket,
          needTrim: true,
        });
        break;
      // 没有变量的模板字符串: `张三`
      case SyntaxKind.FirstTemplateToken: {
        this.pushPositionIfTargetLocale({
          start: node.getStart(),
          end: node.getEnd(),
          localeToSearch: this.removeTextVariableSymobl(node.getText()),
          needTrim: false,
        });
        break;
      }
      // 模板字符串: `${name}张三${gender}李四`
      case ts.SyntaxKind.TemplateExpression: {
        const template = node as TemplateExpression;
        const literalTextNodes: {
          start: number;
          end: number;
          targetLocaleMaybe: string;
        }[] = [
          {
            start: template.head.getStart(),
            end: template.head.getEnd(),
            targetLocaleMaybe: template.head.rawText,
          },
        ];

        template.templateSpans.forEach((templateSpan) => {
          literalTextNodes.push({
            start: templateSpan.getStart(),
            targetLocaleMaybe: templateSpan.literal.rawText,
            end: templateSpan.getEnd(),
          });
        });

        literalTextNodes.forEach((l) => {
          const startOffset = this.file
            .slice(l.start, l.end)
            .indexOf(l.targetLocaleMaybe);

          this.pushPositionIfTargetLocale({
            start: l.start + startOffset,
            end: l.start + startOffset + l.targetLocaleMaybe.length,
            localeToSearch: l.targetLocaleMaybe,
            needTrim: true,
            formatter(textKey: string) {
              return '${' + textKey + '}';
            },
          });
        });
        break;
      }
    }
    ts.forEachChild(node, (n) => this.traverseAstAndExtractLocales(n));
  }
}

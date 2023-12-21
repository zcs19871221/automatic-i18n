import * as ts from 'typescript';
import * as fs from 'fs-extra';
import * as path from 'path';
import { SyntaxKind, TemplateExpression } from 'typescript';
import { BundleReplacer } from './BundleReplacer';
import { Opt } from './types';

interface Warning {
  start: number;
  end: number;
  text: string;
}

export class FileReplacer {
  private static ignoreWarningKey = '@ignore';

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
    } catch (error: any) {
      if (error.message) {
        error.message = '@ ' + this.fileLocate + ' ' + error.message;
      }
      console.error(error);
    } finally {
      this.clear();
    }
  }

  private static exportName = 'i18';

  private static localesProperty = 'locales';

  public static localeMapToken: string = `${FileReplacer.exportName}.${FileReplacer.localesProperty}.`;

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

    const push = (startPos: number, endPos: number, text: string) => {
      let textKey = this.bundleReplacer.getOrSetLocaleTextKeyIfAbsence(text);
      textKey = formatter(textKey);

      this.positionToReplace.push({
        startPos,
        endPos,
        newText: textKey,
      });
    };
    if (needTrim) {
      localeToSearch.replace(
        /(?:\d+)?[\u4e00-\u9fa5]+/g,
        (matched: string, index: number) => {
          push(start + index, start + index + matched.length, matched);
          return '';
        }
      );
    } else {
      push(start, end, localeToSearch);
    }
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
      this.opt.tsTarget,
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
      const tsNocheckMatched = this.file.match(
        /(\n|^)\/\/\s*@ts-nocheck[^\n]*\n/
      );
      const insertIndex =
        tsNocheckMatched === null
          ? 0
          : (tsNocheckMatched.index ?? 0) + tsNocheckMatched[0].length;
      this.file =
        this.file.slice(0, insertIndex) +
        this.createImportStatement() +
        this.file.slice(insertIndex);
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
    return text.replace(/^['"`]/, '').replace(/['"`]$/, '');
  }

  private textKeyAddJsxVariableBacket(textKey: string) {
    return '{' + textKey + '}';
  }

  private ignoreSpeicalCase(text: string) {
    const specail = [
      '实际值',
      '预测值',
      '店',
      '设备',
      '预测误差上限',
      '安装日期',
      '采购金额',
      '产品描述',
      '生产厂商',
      '采购日期',
      '咖啡机1',
      '咖啡机2',
      '咖啡机3',
    ];
    return specail.some((s) => text.includes(s));
  }

  private traverseAstAndExtractLocales(node: ts.Node) {
    if (!this.includesTargetLocale(node.getText())) {
      return;
    }

    switch (node.kind) {
      // 字符串字面量: "你好" '大家' 以及jsx中的属性常量: <div name="张三"/>
      case SyntaxKind.StringLiteral:
        {
          // 跳过import
          if (node.parent?.kind === ts.SyntaxKind.ImportDeclaration) {
            return;
          }
          // 跳过equal判断 type === '店' 和 includes判断
          if (
            this.stringLiteralIsInEqualBLock(node) ||
            this.stringLiteralIsChildOfIncludeBlock(node)
          ) {
            if (
              !this.ignoreWarning(node) &&
              !this.ignoreWarning(node.parent) &&
              !this.ignoreSpeicalCase(node.getText())
            ) {
              this.addWarningInfo({
                text:
                  'do not use locale literal to do [===] or [includes], maybe an error! use /* ' +
                  FileReplacer.ignoreWarningKey +
                  ' */ after text to ignore warning or refactor code!',
                start: node.getStart(),
                end: node.getEnd(),
              });
            }

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
            targetLocaleMaybe: template.head.rawText ?? '',
          },
        ];

        template.templateSpans.forEach((templateSpan) => {
          literalTextNodes.push({
            start: templateSpan.getStart(),
            targetLocaleMaybe: templateSpan.literal.rawText ?? '',
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
      case SyntaxKind.Identifier: {
        if (
          this.opt.localeToSearch !== 'en-us' &&
          this.includesTargetLocale(node.getText()) &&
          !this.ignoreWarning(node) &&
          !this.ignoreSpeicalCase(node.getText())
        ) {
          this.addWarningInfo({
            text: 'property name of object should be english',
            start: node.getStart(),
            end: node.getEnd(),
          });
        }
        break;
      }
    }
    ts.forEachChild(node, (n) => this.traverseAstAndExtractLocales(n));
  }

  private ignoreWarning(node: ts.Node) {
    return node.parent?.getFullText().includes(FileReplacer.ignoreWarningKey);
  }
  private addWarningInfo({ start, end, text }: Warning) {
    this.bundleReplacer.warnings.push(
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

  private stringLiteralIsChildOfIncludeBlock(node: ts.Node) {
    if (
      node.parent?.kind === SyntaxKind.ArrayLiteralExpression &&
      node.parent?.parent?.kind === SyntaxKind.PropertyAccessExpression
    ) {
      const name = (node.parent?.parent as ts.PropertyAccessExpression)?.name;
      return name.getText() === 'includes';
    }
    return false;
  }

  private stringLiteralIsInEqualBLock(node: ts.Node) {
    if (node.parent?.kind === ts.SyntaxKind.BinaryExpression) {
      const expression = node.parent as ts.BinaryExpression;

      return (
        expression.operatorToken.kind === SyntaxKind.EqualsEqualsToken ||
        expression.operatorToken.kind === SyntaxKind.EqualsEqualsEqualsToken
      );
    }
    return false;
  }
}

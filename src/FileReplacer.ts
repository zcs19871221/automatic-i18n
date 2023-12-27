import * as ts from 'typescript';
import { ImportDeclaration, SyntaxKind } from 'typescript';
import { BundleReplacer } from './BundleReplacer';
import { Opt } from './types';

interface Warning {
  start: number;
  end: number;
  text: string;
}
interface Position {
  start: number;
  end: number;
  newText: string;
}

interface TemplateString {
  start: number;
  end: number;
  replaceHoders: {
    start: number;
    end: number;
    paramValue: string;
  }[];
}
export class FileReplacer {
  private static ignoreWarningKey = '@ignore';

  constructor(
    private readonly fileLocate: string,
    private readonly bundleReplacer: BundleReplacer,
    private readonly opt: Opt,
    private file: string
  ) {
    this.file = file;
  }

  public replace() {
    try {
      this.extractLocales();
      return this.replaceLocalesIfExists();
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

  private static property = 'intl';

  public static localeMapToken(key: string, map?: Record<string, string>) {
    let params = '';
    if (map) {
      params += ',';
      params +=
        Object.entries<string>(map).reduce((text: string, [key, value]) => {
          if (key === value) {
            return text + key + ',';
          } else {
            return text + `${key}: ${value}` + ',';
          }
        }, '{') + '}';
    }
    return `${FileReplacer.exportName}.${FileReplacer.property}.formatMessage({id: '${key}'}${params})`;
  }

  private createImportStatement() {
    return `import { ${FileReplacer.exportName} } from '${this.opt.importPath}';\n`;
  }

  private positionToReplace: Position[] = [];

  private generateNewText({
    localeTextOrPattern,
    params,
  }: {
    localeTextOrPattern: string;
    params?: Record<string, string>;
  }) {
    const localeKey =
      this.bundleReplacer.getOrSetLocaleTextKeyIfAbsence(localeTextOrPattern);

    return FileReplacer.localeMapToken(localeKey, params);
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

  private extractLocales() {
    const sourceFile = ts.createSourceFile(
      this.fileLocate,
      this.file,
      this.opt.tsTarget,
      true
    );
    this.traverseAstAndExtractLocales(sourceFile);
  }

  private replaceLocalesIfExists(): string | null {
    if (this.positionToReplace.length === 0) {
      return null;
    }

    this.positionToReplace.sort((a, b) => b.start - a.start);
    let prevStart: number | null = null;
    this.positionToReplace.forEach(
      ({ start: startPos, end: endPos, newText }) => {
        if (prevStart === null) {
          prevStart = startPos;
        } else if (endPos >= prevStart) {
          throw new Error(`error parse at ${prevStart}`);
        }
        this.file =
          this.file.slice(0, startPos) + newText + this.file.slice(endPos);
      }
    );

    if (!this.hasImportedI18nModules) {
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
    return this.file;
  }

  private removeTextVariableSymobl(text: string) {
    return text.replace(/^['"`]/, '').replace(/['"`]$/, '');
  }

  private textKeyAddJsxVariableBacket(textKey: string) {
    return '{' + textKey + '}';
  }

  private templateStrings: TemplateString[] = [];

  private peek() {
    if (this.templateStrings.length > 0) {
      return this.templateStrings[this.templateStrings.length - 1];
    }
    return null;
  }

  private handleTemplateSpan(node: ts.TemplateSpan) {
    const first = node.getChildren()[0];
    const startSymbol = '${';
    const endSymbol = '}';
    this.templateStrings.push({
      start: this.file.lastIndexOf(startSymbol, node.getStart()),
      end: this.file.indexOf(endSymbol, first.getEnd()) + endSymbol.length,
      replaceHoders: [],
    });
    ts.forEachChild(node, (n) => this.traverseAstAndExtractLocales(n));
    this.handleVariablePop();
  }

  private handleTemplate(node: ts.TemplateExpression) {
    this.templateStrings.push({
      start: node.getStart(),
      end: node.getEnd(),
      replaceHoders: [],
    });
    ts.forEachChild(node, (n) => this.traverseAstAndExtractLocales(n));
    this.handleTemplatePop();
  }

  private handleTemplatePop() {
    const current = this.templateStrings.pop()!;
    const startTag = '`';
    const endTag = '`';

    let textPattern = '';
    let start = current.start + startTag.length;
    const variables: Record<string, string> = {};
    current?.replaceHoders.forEach((c, index) => {
      textPattern += this.file.slice(start, c.start);
      const paramName = 'v' + (index + 1);
      variables[paramName] = c.paramValue;
      textPattern += '{' + paramName + '}';
      start = c.end;
    });
    textPattern += this.file.slice(start, current.end - endTag.length);

    const textKey =
      this.bundleReplacer.getOrSetLocaleTextKeyIfAbsence(textPattern);
    const paramValue = FileReplacer.localeMapToken(textKey, variables);

    const prev = this.peek();

    if (prev != null) {
      prev.replaceHoders.push({
        start: current.start,
        end: current.end,
        paramValue,
      });
    } else {
      this.positionToReplace.push({
        start: current.start,
        end: current.end,
        newText: paramValue,
      });
    }
  }

  private handleVariablePop() {
    const current = this.templateStrings.pop()!;
    const startTag = '${';
    const endTag = '}';

    let paramValue = '';
    let start = current.start + startTag.length;
    current?.replaceHoders.forEach((c, index) => {
      paramValue += this.file.slice(start, c.start);
      paramValue += c.paramValue;
      start = c.end;
    });
    paramValue += this.file.slice(start, current.end - endTag.length);

    const prev = this.peek();
    if (!prev) {
      throw new Error('TemplateSpan should have a templateExpression');
    }

    prev.replaceHoders.push({
      start: current.start,
      end: current.end,
      paramValue,
    });
  }

  private hasImportedI18nModules: boolean = false;

  private traverseAstAndExtractLocales(node: ts.Node) {
    console.log(node.kind, SyntaxKind[node.kind], node.getText());
    switch (node.kind) {
      // 判断是否引入i18
      case SyntaxKind.ImportDeclaration: {
        const importNode = node as ImportDeclaration;
        if (
          importNode.moduleSpecifier.getText().includes(this.opt.importPath) &&
          importNode.importClause?.getText().includes(FileReplacer.exportName)
        ) {
          this.hasImportedI18nModules = true;
        }
        break;
      }
      // 字符串字面量: "你好" '大家' 以及jsx中的属性常量: <div name="张三"/>
      case SyntaxKind.StringLiteral:
        {
          if (!this.includesTargetLocale(node.getText())) {
            return;
          }
          // 跳过import
          if (node.parent?.kind === ts.SyntaxKind.ImportDeclaration) {
            return;
          }
          if (this.ignore(node)) {
            return '';
          }
          // 跳过equal判断 type === '店' 和 includes判断
          if (
            this.stringLiteralIsInEqualBLock(node) ||
            this.stringLiteralIsChildOfIncludeBlock(node)
          ) {
            this.addWarningInfo({
              text:
                'do not use locale literal to do [===] or [includes], maybe an error! use /* ' +
                FileReplacer.ignoreWarningKey +
                ' */ before text to ignore warning or refactor code!',
              start: node.getStart(),
              end: node.getEnd(),
            });
            return;
          }
          let newText = this.generateNewText({
            localeTextOrPattern: this.removeTextVariableSymobl(node.getText()),
          });
          if (node.parent.kind === SyntaxKind.JsxAttribute) {
            newText = this.textKeyAddJsxVariableBacket(newText);
          }
          const stackItem = this.peek();
          if (stackItem !== null) {
            stackItem.replaceHoders.push({
              start: node.getStart(),
              end: node.getEnd(),
              paramValue: newText,
            });
          } else {
            this.positionToReplace.push({
              start: node.getStart(),
              end: node.getEnd(),
              newText,
            });
          }
        }
        break;
      // html文本标签中字面量<div>大家好</div>
      case SyntaxKind.JsxText:
        if (!this.includesTargetLocale(node.getText())) {
          return;
        }
        let newText = this.generateNewText({
          localeTextOrPattern: node.getText(),
        });
        newText = this.textKeyAddJsxVariableBacket(newText);
        this.positionToReplace.push({
          start: node.getStart(),
          end: node.getEnd(),
          newText,
        });
        break;
      // 没有变量的模板字符串: `张三`
      case SyntaxKind.FirstTemplateToken: {
        if (!this.includesTargetLocale(node.getText())) {
          return;
        }
        this.positionToReplace.push({
          start: node.getStart(),
          end: node.getEnd(),
          newText: this.generateNewText({
            localeTextOrPattern: this.removeTextVariableSymobl(node.getText()),
          }),
        });
        break;
      }
      // 模板字符串: `${name}张三${gender}李四`
      case ts.SyntaxKind.TemplateExpression: {
        if (!this.includesTargetLocale(node.getText())) {
          return;
        }
        this.handleTemplate(node as ts.TemplateExpression);
        return;
      }
      // 模板字符串: `${name}张三${gender}李四`
      case ts.SyntaxKind.TemplateSpan: {
        this.handleTemplateSpan(node as ts.TemplateSpan);
        return;
      }
      // 中文对象名警告和template中的变量${name}提取
      case SyntaxKind.Identifier: {
        if (
          this.opt.localeToReplace !== 'en-us' &&
          this.includesTargetLocale(node.getText()) &&
          !this.ignore(node)
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

  private ignore(node: ts.Node) {
    return node.getFullText().includes(FileReplacer.ignoreWarningKey);
  }
  private addWarningInfo({ start, end, text }: Warning) {
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

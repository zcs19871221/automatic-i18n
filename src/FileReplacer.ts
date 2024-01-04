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

interface Holder {
  start: number;
  end: number;
  paramValue: string;
}

interface TemplateString {
  start: number;
  end: number;
  replaceHoders: Holder[];
  jsxExpressionWithJsx?: boolean;
}
export class FileReplacer {
  private static ignoreWarningKey = '@ignore';

  constructor(
    private readonly fileLocate: string,
    private readonly bundleReplacer: BundleReplacer,
    private readonly opt: Opt,
    private file: string
  ) {}

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
    if (map && Object.keys(map).length > 0) {
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

  private push(p: Position) {
    if (!this.includesTargetLocale(this.file.slice(p.start, p.end))) {
      return;
    }
    this.positionToReplace.push(p);
  }

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

  private includesTargetLocale(text: string) {
    return /[\u4e00-\u9fa5]+/g.test(text);
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
    this.handleVariablePop(startSymbol, endSymbol);
  }

  private handleJsxExpressioninContent(node: ts.JsxExpression) {
    const startSymbol = '{';
    const endSymbol = '}';
    this.templateStrings.push({
      start: node.getStart(),
      end: node.getEnd(),
      replaceHoders: [],
    });
    ts.forEachChild(node, (n) => this.traverseAstAndExtractLocales(n));
    this.handleVariablePop(startSymbol, endSymbol);
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

  private handleBlockFinish(skipPrev: number, skipAfter: number) {
    const current = this.templateStrings.pop()!;

    let textPattern = '';
    let start = current.start + skipPrev;
    const variables: Record<string, string> = {};
    const paramValues = current.replaceHoders
      .map((holder) => holder.paramValue)
      .reduce((valueMapKey: Record<string, string>, value) => {
        if (!valueMapKey[value]) {
          valueMapKey[value] = 'v' + (Object.keys(valueMapKey).length + 1);
        }
        return valueMapKey;
      }, {});

    current.replaceHoders.forEach((c, index) => {
      textPattern += this.file.slice(start, c.start);
      const paramName = paramValues[c.paramValue];
      variables[paramName] = c.paramValue;
      textPattern += '{' + paramName + '}';
      start = c.end;
    });
    textPattern += this.file.slice(start, current.end - skipAfter);

    if (!this.includesTargetLocale(textPattern)) {
      return null;
    }
    const textKey =
      this.bundleReplacer.getOrSetLocaleTextKeyIfAbsence(textPattern);
    const paramValue = FileReplacer.localeMapToken(textKey, variables);

    return { start: current.start, end: current.end, paramValue };
  }

  private handleJsxContentsFinish() {
    const ans = this.handleBlockFinish(0, 0);
    if (!ans) {
      return;
    }
    this.push({
      start: ans.start,
      end: ans.end,
      newText: '{' + ans.paramValue + '}',
    });
  }

  private handleTemplatePop() {
    const startTag = '`';
    const endTag = '`';

    const ans = this.handleBlockFinish(startTag.length, endTag.length);
    if (!ans) {
      return;
    }
    const prev = this.peek();
    if (prev === null || prev.jsxExpressionWithJsx) {
      this.push({
        start: ans.start,
        end: ans.end,
        newText: ans.paramValue,
      });
    } else {
      prev.replaceHoders.push(ans);
    }
  }

  private inlcudeJsxElement(node: any) {
    let hasJsxElement = false;
    ts.forEachChild(node, (n) => {
      if (n.kind === SyntaxKind.JsxElement) {
        hasJsxElement = true;
      }
      if (hasJsxElement) {
        return;
      }
      hasJsxElement = this.inlcudeJsxElement(n);
    });
    return hasJsxElement;
  }

  private handleJsxElement(node: any) {
    if (!this.includesTargetLocale(node.getText())) {
      return;
    }
    const openingElement: any = node.openingElement || node.openingFragment;
    const closingElement: any = node.closingElement || node.closingFragment;
    this.traverseAstAndExtractLocales(openingElement);

    const closeRange = (n: ts.Node) => {
      this.peek()!.end = n.getStart();
      this.handleJsxContentsFinish();
    };

    this.templateStrings.push({
      start: openingElement.getEnd(),
      end: 0,
      replaceHoders: [],
    });
    node.children
      .filter((e: any) => e !== openingElement && e !== closingElement)

      // JsxText | JsxExpression | JsxElement | JsxSelfClosingElement | JsxFragment;
      .forEach((n: any) => {
        console.log(n.kind, SyntaxKind[n.kind], n.getText());
        switch (n.kind) {
          case SyntaxKind.JsxElement:
          case SyntaxKind.JsxFragment:
            this.peek()!.end = n.getStart();
            closeRange(n);
            this.handleJsxElement(n);
            this.templateStrings.push({
              start: (n.closingElement || n.closingFragment).getEnd(),
              end: 0,
              replaceHoders: [],
            });
            break;
          case SyntaxKind.JsxExpression:
            if (this.inlcudeJsxElement(n)) {
              closeRange(n);
              this.templateStrings.push({
                start: n.getStart(),
                end: 0,
                replaceHoders: [],
                jsxExpressionWithJsx: true,
              });
            }
            this.handleJsxExpressioninContent(n);
            break;
          default:
            break;
        }
      });
    closeRange(closingElement);
  }

  private handleVariablePop(startTag: string, endTag: string) {
    const current = this.templateStrings.pop()!;

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
          if (stackItem !== null && !stackItem.jsxExpressionWithJsx) {
            stackItem.replaceHoders.push({
              start: node.getStart(),
              end: node.getEnd(),
              paramValue: newText,
            });
          } else {
            this.push({
              start: node.getStart(),
              end: node.getEnd(),
              newText,
            });
          }
        }
        break;
      // html文本标签中字面量<div>大家好</div>
      case SyntaxKind.JsxElement:
      case SyntaxKind.JsxFragment:
        this.handleJsxElement(node);
        return;
      // 没有变量的模板字符串: `张三`
      case SyntaxKind.FirstTemplateToken: {
        if (!this.includesTargetLocale(node.getText())) {
          return;
        }
        this.push({
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

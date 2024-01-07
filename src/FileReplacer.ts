import * as ts from 'typescript';
import { ImportDeclaration, SyntaxKind } from 'typescript';
import { BundleReplacer } from './BundleReplacer';
import { Opt } from './types';

interface Warning {
  start: number;
  end: number;
  text: string;
}

class Context {
  public childs: Context[] = [];
  constructor(
    public replacer: FileReplacer,
    public start: number,
    public end: number,
    public newStr: string = ''
  ) {}

  protected concatVariable(startSkip: number, endSkip: number): string {
    return this.concat(startSkip, endSkip);
  }

  protected concatBlock(
    startSkip: number,
    endSkip: number
  ): { str: string; keyMapValue: Record<string, string> } {
    const valueMapKey: Record<string, string> = {};
    const keyMapValue: Record<string, string> = {};

    const str = this.concat(startSkip, endSkip, (str) => {
      if (!valueMapKey[str]) {
        const key = 'v' + (Object.keys(valueMapKey).length + 1);
        valueMapKey[str] = key;
        keyMapValue[key] = str;
      }

      return '{' + valueMapKey[str] + '}';
    });

    return { str, keyMapValue };
  }

  protected concat(
    startSkip: number,
    endSkip: number,
    strHandler: (str: string) => string = (str) => str
  ) {
    let str = '';
    let start = this.start + startSkip;
    this.childs.forEach((c) => {
      str += this.replacer.file.slice(start, c.start);
      str += strHandler(c.newStr);
      start = c.end;
    });
    str += this.replacer.file.slice(start, this.end - endSkip);
    return str;
  }
}

class StringLiteralContext extends Context {}

class JsxVirutalBlock extends Context {
  public setNewStr(): string {
    const { keyMapValue, str } = this.concatBlock(0, 0);
    if (!this.replacer.includesTargetLocale(str)) {
      return '';
    }

    const newStr = str.replace(
      /(^[\s\n]+)|([\s\n]+$)/g,
      (_match, start, end) => {
        if (start) {
          this.start += _match.length;
        } else {
          this.end -= _match.length;
        }
        return '';
      }
    );
    const textKey =
      this.replacer.bundleReplacer.getOrSetLocaleTextKeyIfAbsence(newStr);
    this.newStr = '{' + FileReplacer.localeMapToken(textKey, keyMapValue) + '}';
    return this.newStr;
  }
}

class RootContext extends Context {}

class Jsx extends Context {
  private openingStart: number;
  private closingEnd: number;

  constructor(opt: {
    openingStart: number;
    openingEnd: number;
    closingStart: number;
    closingEnd: number;
    fileReplacer: FileReplacer;
  }) {
    super(opt.fileReplacer, opt.openingEnd, opt.closingStart);
    this.openingStart = opt.openingStart;
    this.closingEnd = opt.closingEnd;
  }

  public includeLocaleText = false;

  public mergeChilds(): Context[] {
    const newChilds: Context[] = [];
    let start = this.start;
    let block: Context[] = [];
    const addJsxVirtualBlock = (end: number, nextStart: number) => {
      const virtualBlock = new JsxVirutalBlock(this.replacer, start, end);
      virtualBlock.childs.push(...block);
      virtualBlock.setNewStr();
      if (virtualBlock.newStr) {
        newChilds.push(virtualBlock);
      }
      start = nextStart;
      block = [];
    };
    this.childs.forEach((c) => {
      if (c instanceof Jsx) {
        addJsxVirtualBlock(c.openingStart, c.closingEnd);
        newChilds.push(...c.mergeChilds());
        return;
      }

      if (c instanceof JsxExpression && c.includeJsx) {
        addJsxVirtualBlock(c.start, c.end);
        c.generateStr();
        if (c.newStr) {
          newChilds.push(c);
        }
        return;
      }

      block.push(c);
    });

    addJsxVirtualBlock(this.end, -1);

    return newChilds;
  }
}

class JsxExpression extends Context {
  public generateStr() {
    if (this.includeJsx && this.childs.length === 0) {
      this.newStr = '';
    }
    this.newStr = this.concatVariable('{'.length, '}'.length);
    return this.newStr;
  }

  public includeJsx = false;
}

class Template extends Context {
  public setNewStr() {
    const { keyMapValue, str } = this.concatBlock('`'.length, '`'.length);
    if (!this.replacer.includesTargetLocale(str)) {
      return '';
    }
    const textKey =
      this.replacer.bundleReplacer.getOrSetLocaleTextKeyIfAbsence(str);
    this.newStr = FileReplacer.localeMapToken(textKey, keyMapValue);
    return this.newStr;
  }

  public push(templateExpression: TemplateExpression) {
    templateExpression.setNewStr();
    this.childs.push(templateExpression);
  }
}

class TemplateExpression extends Context {
  public setNewStr() {
    this.newStr = this.concatVariable('${'.length, '}'.length);
    return this.newStr;
  }
}

export class FileReplacer {
  private static ignoreWarningKey = '@ignore';

  private readonly rootContext: RootContext;
  constructor(
    private readonly fileLocate: string,
    public readonly bundleReplacer: BundleReplacer,
    private readonly opt: Opt,
    public file: string
  ) {
    this.rootContext = new RootContext(this, 0, file.length);
  }

  public replace() {
    try {
      this.extractLocales();
      if (!this.rootContext.childs.length) {
        return this.file;
      }
      this.rootContext.childs = this.rootContext.childs.filter((c) => c.newStr);
      this.rootContext.childs.sort((a, b) => b.start - a.start);
      let prevStart: number | null = null;
      this.rootContext.childs.forEach(
        ({ start: start, end: end, newStr: str }) => {
          if (prevStart === null) {
            prevStart = start;
          } else if (end >= prevStart) {
            throw new Error(`error parse at ${prevStart}`);
          }
          this.file = this.file.slice(0, start) + str + this.file.slice(end);
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
            return text + `${key}: ${value === '' ? "''" : value}` + ',';
          }
        }, '{') + '}';
    }
    return `${FileReplacer.exportName}.${FileReplacer.property}.formatMessage({id: '${key}'}${params})`;
  }

  private createImportStatement() {
    return `import { ${FileReplacer.exportName} } from '${this.opt.importPath}';\n`;
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

  public includesTargetLocale(text: string) {
    return /[\u4e00-\u9fa5]+/g.test(text);
  }

  private clear() {
    this.file = '';
    this.rootContext.newStr = '';
    this.rootContext.childs = [];
  }

  private extractLocales() {
    const sourceFile = ts.createSourceFile(
      this.fileLocate,
      this.file,
      this.opt.tsTarget,
      true
    );
    this.traverseAstAndExtractLocales(sourceFile, this.rootContext);
  }

  private removeTextVariableSymobl(text: string) {
    return text.replace(/^['"`]/, '').replace(/['"`]$/, '');
  }

  private textKeyAddJsxVariableBacket(textKey: string) {
    return '{' + textKey + '}';
  }

  private handleTemplate(node: ts.TemplateExpression, context: Context) {
    const template = new Template(this, node.getStart(), node.getEnd());
    ts.forEachChild(node, (n) =>
      this.traverseAstAndExtractLocales(n, template)
    );
    const newStr = template.setNewStr();
    if (!newStr) {
      return;
    }
    context.childs.push(template);
  }

  private handleTemplateExpression(node: ts.TemplateSpan, context: Context) {
    const first = node.getChildren()[0];
    const startSymbol = '${';
    const endSymbol = '}';
    const templateExpression = new TemplateExpression(
      this,
      this.file.lastIndexOf(startSymbol, node.getStart()),
      this.file.indexOf(endSymbol, first.getEnd()) + endSymbol.length
    );
    ts.forEachChild(node, (n) =>
      this.traverseAstAndExtractLocales(n, templateExpression)
    );
    templateExpression.newStr = templateExpression.setNewStr();
    context.childs.push(templateExpression);
  }

  private handleJsxExpression(node: ts.JsxExpression, context: Context) {
    const jsxExpression = new JsxExpression(
      this,
      node.getStart(),
      node.getEnd()
    );
    ts.forEachChild(node, (n) =>
      this.traverseAstAndExtractLocales(n, jsxExpression)
    );
    if (jsxExpression.includeJsx && jsxExpression.childs.length > 0) {
      jsxExpression.generateStr();
      this.rootContext.childs.push(jsxExpression);
    } else {
      jsxExpression.generateStr();
      context.childs.push(jsxExpression);
    }
  }

  private handleJsx(node: any, context: Context) {
    const openingElement: any = node.openingElement || node.openingFragment;
    const closingElement: any = node.closingElement || node.closingFragment;
    this.traverseAstAndExtractLocales(openingElement, context);
    const jsx = new Jsx({
      fileReplacer: this,
      openingStart: openingElement.getStart(),
      openingEnd: openingElement.getEnd(),
      closingEnd: closingElement.getEnd(),
      closingStart: closingElement.getStart(),
    });

    node.children
      .filter((e: any) => e !== openingElement && e !== closingElement)
      .forEach((n: any) => {
        this.traverseAstAndExtractLocales(n, jsx);
      });

    jsx.mergeChilds().forEach((child) => {
      this.rootContext.childs.push(child);
    });
    context.childs.push(jsx);
  }

  private hasImportedI18nModules: boolean = false;

  private traverseAstAndExtractLocales(node: ts.Node, context: Context) {
    // console.log(node.kind, SyntaxKind[node.kind], node.getText());
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

          context.childs.push(
            new StringLiteralContext(
              this,
              node.getStart(),
              node.getEnd(),
              newText
            )
          );
        }
        break;
      // html文本标签中字面量<div>大家好</div>
      case SyntaxKind.JsxElement:
      case SyntaxKind.JsxFragment:
        this.handleJsx(node, context);
        break;
      case SyntaxKind.JsxExpression: {
        this.handleJsxExpression(node as ts.JsxExpression, context);
        break;
      }
      case SyntaxKind.JsxText: {
        if (this.includesTargetLocale(node.getText())) {
          (context as Jsx).includeLocaleText = true;
        }
        break;
      }
      // 没有变量的模板字符串: `张三`
      case SyntaxKind.FirstTemplateToken: {
        if (!this.includesTargetLocale(node.getText())) {
          return;
        }
        context.childs.push(
          new StringLiteralContext(
            this,
            node.getStart(),
            node.getEnd(),
            this.generateNewText({
              localeTextOrPattern: this.removeTextVariableSymobl(
                node.getText()
              ),
            })
          )
        );
        break;
      }
      // 模板字符串: `${name}张三${gender}李四`
      case ts.SyntaxKind.TemplateExpression: {
        this.handleTemplate(node as ts.TemplateExpression, context);
        break;
      }
      // 模板字符串: `${name}张三${gender}李四`
      case ts.SyntaxKind.TemplateSpan: {
        this.handleTemplateExpression(node as ts.TemplateSpan, context);
        break;
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
      default:
        ts.forEachChild(node, (n) =>
          this.traverseAstAndExtractLocales(n, context)
        );
        break;
    }
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

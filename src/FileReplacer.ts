import * as ts from 'typescript';
import { ImportDeclaration, SyntaxKind } from 'typescript';
import { BundleReplacer } from './BundleReplacer';
import { Opt } from './types';
import { Context } from './Context';
import { JsxExpression, Jsx } from './Jsx';
import { RootContext } from './RootContext';
import { Template, TemplateExpression } from './Template';
import { StringLiteralContext } from './StringLiteralContext';

interface Warning {
  start: number;
  end: number;
  text: string;
}

export class FileReplacer {
  private static ignoreWarningKey = '@ignore';

  public rootContext: RootContext;
  constructor(
    private readonly fileLocate: string,
    public readonly bundleReplacer: BundleReplacer,
    private readonly opt: Opt,
    file: string
  ) {
    const sourceFile = ts.createSourceFile(
      this.fileLocate,
      file,
      this.opt.tsTarget,
      true
    );
    this.rootContext = RootContext.of({ node: sourceFile, replacer: this });
    this.rootContext.str = file;
  }

  public replace() {
    try {
      const rootContext = this.rootContext.doHandle();

      return rootContext.str;
    } catch (error: any) {
      if (error.message) {
        error.message = '@ ' + this.fileLocate + ' ' + error.message;
      }
      console.error(error);
    } finally {
      this.rootContext.clear();
    }
  }

  public traverseAstAndExtractLocales(node: ts.Node, context: Context) {
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
          StringLiteralContext.handle({
            node: node as ts.StringLiteral,
            parent: context,
            replacer: this,
          });
        }
        break;
      // html文本标签中字面量<div>大家好</div>
      case SyntaxKind.JsxElement:
      case SyntaxKind.JsxFragment:
      case SyntaxKind.JsxOpeningElement:
      case SyntaxKind.JsxOpeningFragment:
      case SyntaxKind.JsxClosingElement:
      case SyntaxKind.JsxClosingFragment:
      case SyntaxKind.JsxSelfClosingElement:
        Jsx.handle({ node, parent: context, replacer: this });
        break;
      case SyntaxKind.JsxExpression: {
        JsxExpression.handle({
          node: node as ts.JsxExpression,
          parent: context,
          replacer: this,
        });
        break;
      }
      // 没有变量的模板字符串: `张三`
      case SyntaxKind.FirstTemplateToken: {
        StringLiteralContext.handle({
          node: node as ts.StringLiteral,
          parent: context,
          replacer: this,
        });
        break;
      }
      // 模板字符串: `${name}张三${gender}李四`
      case ts.SyntaxKind.TemplateExpression: {
        Template.handle({
          node: node as ts.TemplateExpression,
          parent: context,
          replacer: this,
        });
        break;
      }
      // 模板字符串: `${name}张三${gender}李四`
      case ts.SyntaxKind.TemplateSpan: {
        TemplateExpression.handle({
          node: node as ts.TemplateSpan,
          parent: context,
          replacer: this,
        });
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

  public includesTargetLocale(text: string) {
    return /[\u4e00-\u9fa5]+/g.test(text);
  }
}

import {
  SyntaxKind,
  Node,
  VariableDeclaration,
  FunctionDeclaration,
  Block,
  ParenthesizedExpression,
} from 'typescript';
import {
  JsxChildContext,
  ReplaceContext,
  StringLiteralContext,
  TemplateStringContext,
} from '../replaceContexts';
import { TextInsertContext } from '../replaceContexts/TextInsertContext';
import {
  I18nFormatter,
  FormatOptions,
  FormatReturnType,
} from './I18nFormatter';
import hookEntryFileTemplate from './defaultEntryTemplate';
import path from 'path';

export default class DefaultI18nFormatter extends I18nFormatter {
  protected override doEntryFile(localeFiles: string[]): string {
    return hookEntryFileTemplate(localeFiles);
  }

  protected override renderJsxChildContext(
    context: JsxChildContext,
    { params, defaultMessage }: FormatOptions,
    intlId: string
  ): FormatReturnType | null {
    const paramString = this.paramsString(params);
    const newText = `
      <FormattedMessage
        id="${intlId}"
        defaultMessage="${defaultMessage}"
        ${paramString ? `values={${paramString}}` : ''}
      />
    `;
    return {
      newText,
      dependencies: {
        moduleName: 'react-intl',
        names: ['FormattedMessage'],
      },
    };
  }

  protected override renderTemplateStringContext(
    context: TemplateStringContext,
    opt: FormatOptions,
    intlId: string
  ): FormatReturnType | null {
    return this.render(context, opt, intlId);
  }

  private renderGlobal(
    context: ReplaceContext,
    { params, defaultMessage, originStr }: FormatOptions,
    intlId: string
  ): FormatReturnType | null {
    const newText = this.intlApiExpression(
      intlId,
      defaultMessage,
      `i18n.intl`,
      params
    );
    const localeDist = path.resolve(
      context.i18nReplacer.opt.distLocaleDir,
      'index.tsx'
    );
    const src = context.i18nReplacer.opt.outputToNewDir
      ? path.join(
          context.i18nReplacer.opt.outputToNewDir,
          path.basename(context.fileContext.fileLocate)
        )
      : context.fileContext.fileLocate;

    let relativePath = path.relative(src, localeDist).replace(/\\/g, '/');
    if (!relativePath.replace(/^\.\.\//, '').includes('/')) {
      relativePath = relativePath.replace(/^\.\.\//, './');
    }
    return {
      newText: newText,
      dependencies: {
        moduleName: relativePath,
        names: ['i18n'],
      },
    };
  }

  private render(
    context: ReplaceContext,
    { params, defaultMessage, originStr }: FormatOptions,
    intlId: string
  ) {
    const parentFunctionInfo = DefaultI18nFormatter.getIfInFunctionBody(
      context.getNode()!
    );
    // not in function scope, so skip
    if (parentFunctionInfo == null) {
      context.i18nReplacer.addWarning({
        text: `unable to replace ${context
          .getNode()!
          .getText()} in non component context, put it in React component or use GlobalFormatter `,
        start: context.getNode()?.getStart() ?? 0,
        end: context.getNode()?.getEnd() ?? 0,
        fileContext: context.fileContext,
      });

      return null;
    }

    const { functionName, functionBody } = parentFunctionInfo;
    // in function body, but not a react component(we guess through component name)
    // so we use global api replace
    if (!DefaultI18nFormatter.reactComponentNameReg.test(functionName)) {
      return this.renderGlobal(
        context,
        {
          params,
          defaultMessage,
          originStr,
        },
        intlId
      );
    }
    // we assume it was in react component, first check if already has
    // hook declare
    const hookDeclareExpression = functionBody
      .getText()
      .match(/(?:(?:const)|(?:var)|(?:let)) ([\S]+)\s*=\s*(\w+\.)?useIntl()/);
    const returnValue = (intlObj: string) => {
      return {
        newText: this.intlApiExpression(
          intlId,
          defaultMessage,
          intlObj,
          params
        ),
        dependencies: {
          moduleName: 'react-intl',
          names: ['useIntl'],
        },
      };
    };
    // we have hook, so just replace text
    if (hookDeclareExpression != null) {
      return returnValue(hookDeclareExpression[1]);
    }

    const intlObj = 'intl';
    const contextToAdd: ReplaceContext[] = [];
    // do not have hook, so insert to ParenthesizedExpression,
    // replace start `(` and end `)` with `{` and `}` with some expression
    if (functionBody.kind === SyntaxKind.ParenthesizedExpression) {
      contextToAdd.push(
        new TextInsertContext(
          functionBody.getStart(),
          functionBody.getChildren()[1].getStart(),
          context.fileContext,
          `{\nconst ${intlObj} = useIntl(); \n return `
        )
      );
      contextToAdd.push(
        new TextInsertContext(
          functionBody.getChildren()[2].getStart(),
          functionBody.getChildren()[2].getEnd(),
          context.fileContext,
          `}`
        )
      );
    } else {
      const start = functionBody.getStart() + 1;
      contextToAdd.push(
        new TextInsertContext(
          start,
          start,
          context.fileContext,
          `\nconst ${intlObj} = useIntl(); \n`
        )
      );
    }

    // check if same scope local has already add
    if (
      contextToAdd.some((c) => {
        return context.fileContext
          .getChildren()
          .some((cc) => cc.start == c.start && cc.end === c.end);
      })
    ) {
      return returnValue(intlObj);
    }

    contextToAdd.forEach((c) => {
      c.generateMessage();
      context.fileContext.addChildren(c);
    });

    return returnValue('intl');
  }

  protected override renderStringLiteralContext(
    context: StringLiteralContext,
    opt: FormatOptions,
    intlId: string
  ): FormatReturnType | null {
    return this.render(context, opt, intlId);
  }

  private static reactComponentNameReg = /^[A-Z]/;
  private static getIfInFunctionBody(node: Node): {
    functionName: string;
    functionBody: Block | ParenthesizedExpression;
  } | null {
    const functionExpression = (n: Node) => {
      return (
        n.kind === SyntaxKind.FunctionExpression &&
        n.parent?.kind === SyntaxKind.VariableDeclaration
      );
    };

    const functionDeclaration = (n: Node) => {
      return n.kind === SyntaxKind.FunctionDeclaration;
    };

    const arrowFunction = (n: Node) => {
      return (
        n.kind === SyntaxKind.ArrowFunction &&
        n.parent?.kind === SyntaxKind.VariableDeclaration
      );
    };

    while (node) {
      if (node.kind === SyntaxKind.Parameter) {
        return null;
      }
      if (
        node.parent &&
        (functionExpression(node.parent) || arrowFunction(node.parent))
      ) {
        return {
          functionName:
            (node.parent.parent as VariableDeclaration).name.getText() ?? '',
          functionBody: node as Block | ParenthesizedExpression,
        };
      }
      if (
        node.kind === SyntaxKind.Block &&
        node.parent &&
        functionDeclaration(node.parent)
      ) {
        return {
          functionName:
            (node.parent as FunctionDeclaration).name?.getText() ?? '',
          functionBody: node as Block,
        };
      }
      node = node.parent;
    }
    return null;
  }
}

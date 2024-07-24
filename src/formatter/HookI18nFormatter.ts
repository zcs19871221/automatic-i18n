import {
  SyntaxKind,
  Node,
  VariableDeclaration,
  FunctionDeclaration,
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
import hookEntryFileTemplate from './hookEntryFileTemplate';

export default class HookI18nFormatter extends I18nFormatter {
  protected override doEntryFile(
    localeFiles: string[],
    defaultLocale: string
  ): string {
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

  private render(
    context: ReplaceContext,
    { params, defaultMessage, originStr }: FormatOptions,
    intlId: string
  ) {
    const parentComponent = HookI18nFormatter.getComponent(context.getNode()!);
    if (!parentComponent) {
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
    const hookDeclareExpression = parentComponent
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
    if (hookDeclareExpression != null) {
      return returnValue(hookDeclareExpression[1]);
    }

    const intlObj = 'intl';
    const contextToAdd: ReplaceContext[] = [];
    if (parentComponent.kind === SyntaxKind.ParenthesizedExpression) {
      contextToAdd.push(
        new TextInsertContext(
          parentComponent.getStart(),
          parentComponent.getChildren()[1].getStart(),
          context.fileContext,
          `{\nconst ${intlObj} = useIntl(); \n return `
        )
      );
      contextToAdd.push(
        new TextInsertContext(
          parentComponent.getChildren()[2].getStart(),
          parentComponent.getChildren()[2].getEnd(),
          context.fileContext,
          `}`
        )
      );
    } else {
      const start = parentComponent.getStart() + 1;
      contextToAdd.push(
        new TextInsertContext(
          start,
          start,
          context.fileContext,
          `\nconst ${intlObj} = useIntl(); \n`
        )
      );
    }

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

  private static getComponent(node: Node) {
    let blockNode: Node | null = null;
    const componentNameReg = /^[A-Z]/;
    while (node) {
      if (
        node.kind === SyntaxKind.Block &&
        node.parent?.kind === SyntaxKind.FunctionDeclaration &&
        (node.parent as FunctionDeclaration).name?.escapedText?.match(
          componentNameReg
        )
      ) {
        blockNode = node;
        break;
      }
      if (
        (node.kind === SyntaxKind.Block ||
          node.kind === SyntaxKind.ParenthesizedExpression) &&
        node.parent?.kind === SyntaxKind.ArrowFunction &&
        node.parent.parent?.kind === SyntaxKind.VariableDeclaration &&
        (node.parent.parent as VariableDeclaration).name
          .getText()
          .match(componentNameReg)
      ) {
        blockNode = node;
        break;
      }
      node = node.parent;
    }
    return blockNode;
  }
}

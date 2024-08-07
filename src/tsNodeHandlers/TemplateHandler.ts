import { ReplaceContext } from '../ReplaceContext';
import {
  HandlerOption,
  TsNodeHandler,
  traverseChildren,
} from './TsNodeHandler';
import { SyntaxKind } from 'typescript';

export class TemplateExpressionHandler implements TsNodeHandler {
  match({ node }: HandlerOption): boolean {
    return (
      node.kind === SyntaxKind.TemplateExpression ||
      node.kind === SyntaxKind.TemplateSpan
    );
  }

  handle({
    node,
    parentContext,
    info,
    info: { i18nReplacer, file },
    tsNodeHandlers,
  }: HandlerOption): ReplaceContext | void {
    const template = new ReplaceContext({
      start: node.getStart(),
      end: node.getEnd(),
      info,
    });
    traverseChildren({ node, parentContext: template, info, tsNodeHandlers });

    template.sortAndCheckChildren();
    const skip: Record<number, number> = {};
    template.children.forEach((c) => {
      skip[c.start] = c.end;
    });
    let hasTargetLocale = false;
    for (let i = template.start; i < template.end; ) {
      if (skip[i]) {
        i = skip[i];
        continue;
      }
      if (i18nReplacer.includesTargetLocale(file[i])) {
        hasTargetLocale = true;
        break;
      }
    }
    if (!hasTargetLocale) {
      parentContext.children.push(...template.children);
      return;
    }

    const { str, keyMapValue } = template.useChildrenCreateIntlVariableMessage(
      (str) => str.slice(2, str.length).slice(0, -1)
    );

    template.newText = i18nReplacer.i18nFormatter.renderTemplateString({
      params: keyMapValue,
      defaultMessage: str.slice(1).slice(0, -1),
      originStr: node.getText(),
      info,
      node: node,
      context: template,
    });
    return template;
  }
}

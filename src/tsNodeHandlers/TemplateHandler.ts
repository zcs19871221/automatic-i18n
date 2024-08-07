import { ReplaceContext } from '../ReplaceContext';
import {
  HandledOpt,
  Opt,
  TsNodeHandler,
  handleChildren,
  traverseChildren,
} from './TsNodeHandler';
import { SyntaxKind } from 'typescript';

export class TemplateExpressionHandler implements TsNodeHandler {
  match({ node }: Opt): boolean {
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
  }: HandledOpt): ReplaceContext {
    console.log(node);
    const template = new ReplaceContext({
      start: node.getStart(),
      end: node.getEnd(),
      info,
    });
    traverseChildren({ node, parentContext: template, info, tsNodeHandlers });

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
      return parentContext;
    }

    template.useChildrenCreateIntlVariableMessage((str) => str.replace());
    return;
  }
}

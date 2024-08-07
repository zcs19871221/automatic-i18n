import { SyntaxKind } from 'typescript';
import {
  HandlerOption,
  TsNodeHandler,
  traverseChildren,
} from './TsNodeHandler';
import { ReplaceContext } from '../ReplaceContext';

export class TemplateSpanHandler implements TsNodeHandler {
  match({ node, info: { i18nReplacer } }: HandlerOption): boolean {
    return node.kind === SyntaxKind.TemplateSpan;
  }

  handle({ node, info, tsNodeHandlers }: HandlerOption): ReplaceContext {
    const start = node.getStart() - 2;
    const end = node.getEnd();

    const templateExpression = new ReplaceContext({
      start,
      end,
      info,
    });
    traverseChildren({
      node,
      parentContext: templateExpression,
      info,
      tsNodeHandlers,
    });
    templateExpression.newText = templateExpression.joinChildren();
    return templateExpression;
  }
}

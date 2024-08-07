import { SyntaxKind } from 'typescript';
import {
  HandledOpt,
  Opt,
  TsNodeHandler,
  handleChildren,
} from './TsNodeHandler';
import { ReplaceContext } from '../ReplaceContext';

export class TemplateSpanHandler implements TsNodeHandler {
  match({ node, info: { i18nReplacer } }: Opt): boolean {
    return node.kind === SyntaxKind.TemplateSpan;
  }

  handle({ node, info, tsNodeHandlers }: HandledOpt): ReplaceContext {
    const start = node.getStart() - 2;
    const end = node.getEnd();

    const templateExpression = new ReplaceContext({
      start,
      end,
      info,
    });
    handleChildren({
      node,
      parentContext: templateExpression,
      info,
      tsNodeHandlers,
    });
    templateExpression.newText = templateExpression.joinChildren();
    return templateExpression;
  }
}

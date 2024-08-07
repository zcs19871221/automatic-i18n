import { ReplaceContext } from '../ReplaceContext';
import { HandledOpt, Opt, TsNodeHandler } from './TsNodeHandler';
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
    tsNodeHandlers,
  }: HandledOpt): ReplaceContext {
    console.log(node);

    // const first = node.getChildren()[0];

    // const start = fileContext.info.lastIndexOf(
    //   TemplateExpressionContext.startSymbol,
    //   node.getStart()
    // );
    // const end =
    //   fileContext.info.indexOf('}', first.getEnd()) +
    //   TemplateExpressionContext.endSymbol.length;
    // const templateExpression = new TemplateExpressionContext({
    //   node,
    //   fileContext,
    //   parent,
    //   start,
    //   end,
    // });
    // templateExpression.generateMessage();

    return parentContext;
  }
}

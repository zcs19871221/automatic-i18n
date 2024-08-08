import { SyntaxKind } from 'typescript';
import { HandlerOption, TsNodeHandler, handleChildren } from './TsNodeHandler';
import { ReplaceContext } from '../ReplaceContext';

export class TemplateSpanHandler implements TsNodeHandler {
  match({ node }: HandlerOption): boolean {
    return node.kind === SyntaxKind.TemplateSpan;
  }

  public static getRange({ node, info: { file } }: HandlerOption) {
    const first = node.getChildren()[0];
    const start = file.lastIndexOf('${', node.getStart());
    const end = file.indexOf('}', first.getEnd()) + '}'.length;
    return { start, end };
  }

  handle(option: HandlerOption): ReplaceContext[] {
    const { node, info, tsNodeHandlers } = option;
    const { start, end } = TemplateSpanHandler.getRange(option);

    const templateExpression = new ReplaceContext({
      start,
      end,
      info,
    });
    templateExpression.children = handleChildren({
      node,
      info,
      tsNodeHandlers,
    });
    templateExpression.newText = templateExpression.joinChildren();
    return [templateExpression];
  }
}

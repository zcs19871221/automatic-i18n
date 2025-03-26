import { ReplaceContext } from '../ReplaceContext';
import { TemplateSpanHandler } from './TemplateSpanHandler';
import { HandlerOption, TsNodeHandler, handleChildren } from './TsNodeHandler';
import { SyntaxKind } from 'typescript';

export class TemplateExpressionHandler implements TsNodeHandler {
  // only handle and create new context if templateText has target locale
  // like: `hello:{name}` to
  // formatMessage({
  //   id: key0001",
  //   defaultMessage:'hello:{v1}',
  //   values:{v1:name}
  // })
  match(option: HandlerOption): boolean {
    const {
      node,
      info: { i18nReplacer, file },
    } = option;
    if (node.kind !== SyntaxKind.TemplateExpression) {
      return false;
    }

    const templateSpanHandler = option.tsNodeHandlers.find(
      (h) => h instanceof TemplateSpanHandler
    )!;

    const skip: Record<number, number> = {};
    // node.getChildren()[1]: get a syntax list node contain all expression node
    //node.getChildren()[1].getChildren() get all expression nodes

    for (const child of node.getChildren()[1].getChildren()) {
      if (templateSpanHandler.match({ ...option, node: child })) {
        const range = TemplateSpanHandler.getRange({ ...option, node: child });
        skip[range.start] = range.end;
      }
    }

    for (let i = node.getStart() + 1; i < node.getEnd() - 1; ) {
      if (skip[i]) {
        i = skip[i];
        continue;
      }
      if (i18nReplacer.includesTargetLocale(file[i])) {
        return true;
      }
      i++;
    }
    return false;
  }

  handle({
    node,
    info,
    info: { i18nReplacer },
    tsNodeHandlers,
  }: HandlerOption): ReplaceContext[] {
    const template = new ReplaceContext({
      start: node.getStart(),
      end: node.getEnd(),
      info,
    });
    template.children = handleChildren({
      node,
      info,
      tsNodeHandlers,
    });
    template.sortAndCheckChildren();

    const { str, keyMapValue } = template.useChildrenCreateIntlVariableMessage(
      (str) => str.slice(2, -1)
    );

    template.newText = i18nReplacer.i18nFormatter.renderTemplateString({
      params: keyMapValue,
      defaultMessage: str.slice(1, -1),
      originStr: node.getText(),
      info,
      node: node,
      context: template,
    });
    return [template];
  }
}

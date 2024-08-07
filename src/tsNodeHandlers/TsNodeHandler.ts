import { Node, forEachChild } from 'typescript';
import { Info, ReplaceContext } from '../ReplaceContext';

export interface HandlerOption {
  node: Node;
  info: Info;
  parentContext: ReplaceContext;
  tsNodeHandlers: TsNodeHandler[];
}
export interface TsNodeHandler {
  match(opt: HandlerOption): boolean;
  handle(opt: HandlerOption): ReplaceContext | void;
}

export function traverseChildren(opt: HandlerOption) {
  forEachChild(opt.node, (child) => {
    const newContext = handleNode(opt);
    if (newContext) {
      opt.parentContext.children.push(newContext);
    }
  });
  opt.parentContext.sortAndCheckChildren();
}

export function handleNode(opt: HandlerOption): ReplaceContext | void {
  const { node, info, parentContext, tsNodeHandlers } = opt;
  const matchedTsNodeHandlers = tsNodeHandlers.filter((tsNodeHandler) =>
    tsNodeHandler.match({ node, info, parentContext, tsNodeHandlers })
  );
  if (matchedTsNodeHandlers.length > 1) {
    throw new Error('matched more then 1 ');
  }
  const tsNodeHandler = matchedTsNodeHandlers[0];
  if (tsNodeHandler) {
    const newContext = tsNodeHandler.handle({
      node,
      info,
      parentContext,
      tsNodeHandlers: tsNodeHandlers,
    });
    if (newContext) {
      parentContext.children.push(newContext);
    }
    return newContext;
  }

  traverseChildren({ node, parentContext, info, tsNodeHandlers });
}

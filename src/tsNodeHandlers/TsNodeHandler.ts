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

export function handleChildren(opt: HandlerOption) {
  const childrenContext: ReplaceContext[] = [];
  forEachChild(opt.node, (child) => {
    childrenContext.push(...handleNode({ ...opt, node: child }));
  });
  return childrenContext;
}

export function handleNode(opt: HandlerOption): ReplaceContext[] {
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
      return [newContext];
    }
    return [];
  }

  return handleChildren(opt);
}

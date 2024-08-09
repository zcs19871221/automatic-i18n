import { Node, forEachChild } from 'typescript';
import { Info, ReplaceContext } from '../ReplaceContext';

export interface HandlerOption {
  node: Node;
  info: Info;
  tsNodeHandlers: TsNodeHandler[];
}
export interface TsNodeHandler {
  match(opt: HandlerOption): boolean;
  handle(opt: HandlerOption): ReplaceContext[];
}

export function handleChildren(opt: HandlerOption) {
  const childrenContext: ReplaceContext[] = [];
  forEachChild(opt.node, (child) => {
    childrenContext.push(...handleNode({ ...opt, node: child }));
  });
  return childrenContext;
}

export function handleNode(opt: HandlerOption): ReplaceContext[] {
  const { node, info, tsNodeHandlers } = opt;
  const matchedTsNodeHandlers = tsNodeHandlers.filter((tsNodeHandler) =>
    tsNodeHandler.match({ node, info, tsNodeHandlers })
  );
  if (matchedTsNodeHandlers.length > 1) {
    throw new Error('matched more then 1 ');
  }
  const tsNodeHandler = matchedTsNodeHandlers[0];
  if (tsNodeHandler) {
    return tsNodeHandler.handle({
      node,
      info,
      tsNodeHandlers: tsNodeHandlers,
    });
  }

  return handleChildren(opt);
}

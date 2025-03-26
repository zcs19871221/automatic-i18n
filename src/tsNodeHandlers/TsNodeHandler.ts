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

export function inRange(node: Node, ranges: [number, number][]) {
  const result = ranges.some(
    ([start, end]) => node.getStart() >= start && node.getEnd() - 1 <= end
  );
  return result;
}

export function handleNode(opt: HandlerOption): ReplaceContext[] {
  const { node, info, tsNodeHandlers } = opt;
  const ignore = inRange(node, info.commentRange.ignore);
  if (ignore) {
    return [];
  }
  const matchedTsNodeHandlers = tsNodeHandlers.filter((tsNodeHandler) =>
    tsNodeHandler.match({ node, info, tsNodeHandlers })
  );
  if (matchedTsNodeHandlers.length > 1) {
    // istanbul ignore next
    throw new Error('matched more then 1 ');
  }
  const tsNodeHandler = matchedTsNodeHandlers[0];
  if (!tsNodeHandler) {
    return handleChildren(opt);
  }

  return tsNodeHandler.handle({
    node,
    info,
    tsNodeHandlers: tsNodeHandlers,
  });
}

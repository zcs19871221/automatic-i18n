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

function inRange(node: Node, ranges: [number, number][]) {
  return ranges.some(
    ([start, end]) => node.getStart() >= start && node.getEnd() <= end
  );
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
  if (!tsNodeHandler) {
    return handleChildren(opt);
  }

  if (inRange(node, info.commentRange.ignore)) {
    return [];
  }

  if (
    (info.i18nReplacer.opt.onlyMarked && inRange(node, markedRanges)) ||
    !inRange(node, ignoreRanges)
  ) {
    return handleChildren(opt);
  }

  return tsNodeHandler.handle({
    node,
    info,
    tsNodeHandlers: tsNodeHandlers,
  });
}

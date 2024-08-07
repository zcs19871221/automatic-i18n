import { Node, forEachChild } from 'typescript';
import { Info, ReplaceContext } from '../ReplaceContext';

export interface Opt {
  node: Node;
  info: Info;
  parentContext: ReplaceContext;
}
export interface HandledOpt extends Opt {
  tsNodeHandlers: TsNodeHandler[];
}
export interface TsNodeHandler {
  match(opt: Opt): boolean;
  handle(opt: HandledOpt): ReplaceContext;
}

export function traverseChildren({
  node,
  parentContext,
  info,
  tsNodeHandlers,
}: HandledOpt) {
  forEachChild(node, (child) => {
    const newContext = handleNode({
      node: child,
      parentContext,
      info,
      tsNodeHandlers,
    });
    if (newContext !== parentContext) {
      parentContext.children.push(newContext);
    }
  });
}
export function handleChildren({
  node,
  info: file,
  parentContext,
  tsNodeHandlers,
}: HandledOpt) {
  forEachChild(node, (child) => {
    const matchedTsNodeHandlers = tsNodeHandlers.filter((tsNodeHandler) =>
      tsNodeHandler.match({ node, info: file, parentContext })
    );
    if (matchedTsNodeHandlers.length > 1) {
      throw new Error('matched more then 1 ');
    }
    const tsNodeHandler = matchedTsNodeHandlers[0];
    if (tsNodeHandler) {
      tsNodeHandler.handle({
        node: child,
        info: file,
        parentContext,
        tsNodeHandlers: tsNodeHandlers,
      });
      return;
    }
    handleChildren({
      node: child,
      info: file,
      parentContext,
      tsNodeHandlers,
    });
  });

  parentContext.sortAndCheckChildren();
}

export function handleNode(opt: HandledOpt) {
  const { node, info, parentContext, tsNodeHandlers } = opt;
  const matchedTsNodeHandlers = tsNodeHandlers.filter((tsNodeHandler) =>
    tsNodeHandler.match({ node, info, parentContext })
  );
  if (matchedTsNodeHandlers.length > 1) {
    throw new Error('matched more then 1 ');
  }
  const tsNodeHandler = matchedTsNodeHandlers[0];
  if (tsNodeHandler) {
    const newTextOrParent = tsNodeHandler.handle({
      node,
      info,
      parentContext,
      tsNodeHandlers: tsNodeHandlers,
    });
    if (newTextOrParent !== parentContext) {
      parentContext.children.push(newTextOrParent);
    }
    return newTextOrParent;
  }

  traverseChildren(opt);
  parentContext.sortAndCheckChildren();
  return parentContext;
}

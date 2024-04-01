import { Node } from 'typescript';
import { FileContext, ReplaceContext } from '../replaceContexts';

export interface TsNodeHandler {
  match(
    node: Node,
    fileContext: FileContext,
    parentContext?: ReplaceContext
  ): boolean;
  handle(
    node: Node,
    fileContext: FileContext,
    parentContext?: ReplaceContext
  ): void;
}

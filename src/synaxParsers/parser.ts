import { Node } from 'typescript';

export interface Parser {
  match(node: Node): boolean;

  parse(node: Node): void;
}

import { Node, SyntaxKind } from 'typescript';
import { ReplaceContext } from '../ReplaceContext';
import { HandlerOption, TsNodeHandler, handleNode } from './TsNodeHandler';

export class JsxTagHandler implements TsNodeHandler {
  match({ node }: HandlerOption): boolean {
    return (
      node.kind === SyntaxKind.JsxElement ||
      node.kind === SyntaxKind.JsxFragment
    );
  }

  handle({
    node,
    info,
    info: { i18nReplacer },
    tsNodeHandlers,
  }: HandlerOption): ReplaceContext[] {
    const contexts: ReplaceContext[] = [];
    // handle start html tag
    const startTag = node.getChildren()[0];
    contexts.push(
      ...handleNode({
        node: startTag,
        info,
        tsNodeHandlers,
      })
    );
    // jsxInnerHtml nodes
    const innerHtmlNodes = node.getChildren()[1].getChildren();

    // group jsxTextNode: If a text node is next to an expression node
    // then group them to a new Context, make the message like: "abc{v1}"
    const innerNodes: (Node | Node[])[] = [];

    for (let i = 0; i < innerHtmlNodes.length; i++) {
      const node = innerHtmlNodes[i];
      const prev = innerNodes[innerNodes.length - 1];
      if (
        Array.isArray(prev) &&
        [SyntaxKind.JsxText, SyntaxKind.JsxExpression].includes(node.kind)
      ) {
        prev.push(node);
        continue;
      }

      if (
        node.kind === SyntaxKind.JsxText &&
        i18nReplacer.includesTargetLocale(node.getText())
      ) {
        let index = i;
        const list: Node[] = [];
        while (
          --index >= 0 &&
          [SyntaxKind.JsxText, SyntaxKind.JsxExpression].includes(
            innerHtmlNodes[index].kind
          )
        ) {
          innerNodes.splice(innerNodes.indexOf(innerHtmlNodes[index]), 1);
          list.unshift(innerHtmlNodes[index]);
        }
        list.push(node);
        innerNodes.push(list);
        continue;
      }
      innerNodes.push(node);
    }

    innerNodes.forEach((node) => {
      // handle group
      if (Array.isArray(node)) {
        const expressionNodes = node.filter(
          (n) => n.kind !== SyntaxKind.JsxText
        );
        // make the text and expression to react-intl variable format if there are some expression nodes,
        if (expressionNodes.length > 0) {
          const nodeList = new ReplaceContext({
            start: node[0].getStart(),
            end: node[node.length - 1].getEnd(),
            info,
          });

          expressionNodes.forEach((n) => {
            nodeList.children.push(
              ...handleNode({
                node: n,
                info,
                tsNodeHandlers,
              })
            );
          });
          const { str, keyMapValue } =
            nodeList.useChildrenCreateIntlVariableMessage((str) => {
              if (str.startsWith('{') && str.endsWith('}')) {
                return str.slice(1, -1);
              }
              return str;
            });

          const newStr = str.replace(
            /(^[\s\n]+)|([\s\n]+$)/g,
            (_match, start) => {
              if (start) {
                nodeList.start += _match.length;
              } else {
                nodeList.end -= _match.length;
              }
              return '';
            }
          );

          nodeList.newText = i18nReplacer.i18nFormatter.renderJsxText({
            params: keyMapValue,
            defaultMessage: newStr,
            originStr: newStr,
            info,
            node: node[0],
            context: nodeList,
          });
          contexts.push(nodeList);
          return;
        }

        // node should have only one textNode
        node.forEach((n) => {
          contexts.push(...handleNode({ node: n, info, tsNodeHandlers }));
        });
        return;
      }

      contexts.push(
        ...handleNode({
          node,
          info,
          tsNodeHandlers,
        })
      );
    });

    return contexts;
  }
}

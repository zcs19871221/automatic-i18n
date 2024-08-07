/* eslint-disable react/jsx-curly-brace-presence */
/* eslint-disable no-console */
// @ts-nocheck
import React from 'react';

export const App = () => {
  return (
    <div>
      `${}html中纯文本`
      {flag2 ? (
        <div>{'fdsfdf'}</div>
      ) : (
        <div>{flag2 ? '你好' : `哈哈${name}你好`}</div>
      )}
      然后分割
      {name}然后分割
      <div>fff空节点zzx空节点</div>
      <div>空节点</div>
    </div>
  );
};

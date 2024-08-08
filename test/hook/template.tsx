/* eslint-disable react/jsx-curly-brace-presence */
/* eslint-disable no-console */
// @ts-nocheck
import React from 'react';

export const App = () => {
  const name = '张三';
  return (
    <div name="你好" age={<div>ddd你好abc</div>}>
      你好
      <div>你好{name}再见</div>
    </div>
    // <div>
    //   你好
    //   <div>你好{name}再见</div>
    //   <div>{name ? '你好' : <div>再见</div>}</div>
    //   <div>{name ? '你好' : <div>hello</div>}</div>
    //   {name}
    // </div>
  );
};

// @ts-ignore
import React from 'react';

const flag = true;
const div1 = (
  <div name={<span>sdffds</span>}>
    hello{name}一开始12342142
    <h1>中间{flag ? `${flag}末班${flag}车` : '哈哈'}</h1>你好呀
  </div>
);
export { div1 };

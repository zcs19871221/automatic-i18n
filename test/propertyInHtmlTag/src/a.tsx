// @ts-ignore
import React from 'react';

const Comp = () => (
  <div
    onClick={() => {
      alert('张三');
    }}
  >
    你好
  </div>
);
const Comp4 = () => (
  <div
    onClick={() => {
      alert('张三');
    }}
  >
    你好
  </div>
)
const AlarmSvg = () => <div id="报警">你好</div>;

function Comp2() {
  const hello = '你好';
  return (
    <div id="再见" alt="图片">
      我是{hello}
    </div>
  );
}

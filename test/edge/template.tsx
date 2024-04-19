import React from 'react';
import { FormattedMessage } from 'react-intl';

const string = '非组件字符串不提取';
const templateString = `非组件模板字符串不提取`;

const normalArrowFunction = () => {
  const name = '普通箭头函数字符串不提取';
};
function normalFunction() {
  const name = '普通函数字符串不提取';
}

const ArrowComponent = () => {
  const myIntl = useIntl();
  const name = '箭头函数组件字符串提取';

  return <div>箭头函数组件{name}jsx</div>;
};
function FunctionComponent(params = '参数无法提取') {
  const name = '函数组件字符串提取';

  return <div>函数组件{name}jsx</div>;
}

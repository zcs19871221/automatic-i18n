import React from 'react';
import { FormattedMessage } from 'react-intl';
const value = {
  id: 'key0001',
  defaultMessage: 'English',
};
const string = '非函数内部字符串不提取';
const templateString = `非组件模板字符串不提取`;

const normalArrowFunction = () => {
  const name = '普通箭头函数字符串替换成全局';
};
function normalFunction() {
  const name = '普通函数字符串替换成全局';
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

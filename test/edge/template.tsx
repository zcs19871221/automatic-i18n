import React from 'react';
import { FormattedMessage } from 'react-intl';
const dateRangeErrMsg = () => {
  if (hasDateRangeError) {
    return '不能为空';
  }
  if (isMoreThanOneYear()) {
    return '不能超过一年';
  }
  return '';
};
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
  const name4 = i18.intl.formatMessage({
    id: 'key186O1pBy+R0GyONiAIWzm6g__',
    defaultMessage:
      '碳排放量指标不支持手动创建，配置排放源后，系统将自动生成碳排放量指标',
  });
  return <div>箭头函数组件{name}jsx</div>;
};
function FunctionComponent(params = '参数无法提取') {
  const name = '函数组件字符串提取';

  return <div>函数组件{name}jsx</div>;
}

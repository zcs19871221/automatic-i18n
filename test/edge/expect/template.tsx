import React from 'react';
import { useIntl, FormattedMessage } from 'react-intl';
import { i18n } from './index.tsx';

const dateRangeErrMsg = () => {
  if (hasDateRangeError) {
    return i18n.intl.formatMessage({
      id: 'key0001',
      defaultMessage: '不能为空',
    });
  }
  if (isMoreThanOneYear()) {
    return i18n.intl.formatMessage({
      id: 'key0002',
      defaultMessage: '不能超过一年',
    });
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
  const name = i18n.intl.formatMessage({
    id: 'key0005',
    defaultMessage: '普通箭头函数字符串替换成全局',
  });
};
function normalFunction() {
  const name = i18n.intl.formatMessage({
    id: 'key0006',
    defaultMessage: '普通函数字符串替换成全局',
  });
}

const ArrowComponent = () => {
  const myIntl = useIntl();
  const name = myIntl.formatMessage({
    id: 'key0007',
    defaultMessage: '箭头函数组件字符串提取',
  });
  const name4 = i18.intl.formatMessage({
    id: 'key186O1pBy+R0GyONiAIWzm6g__',
    defaultMessage:
      '碳排放量指标不支持手动创建，配置排放源后，系统将自动生成碳排放量指标',
  });
  return (
    <div>
      <FormattedMessage
        id="key0008"
        defaultMessage="箭头函数组件{v1}jsx"
        values={{ v1: name }}
      />
    </div>
  );
};
function FunctionComponent(params = '参数无法提取') {
  const intl = useIntl();

  const name = intl.formatMessage({
    id: 'key0010',
    defaultMessage: '函数组件字符串提取',
  });

  return (
    <div>
      <FormattedMessage
        id="key0011"
        defaultMessage="函数组件{v1}jsx"
        values={{ v1: name }}
      />
    </div>
  );
}

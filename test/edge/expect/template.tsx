import React from 'react';
import { useIntl, FormattedMessage } from 'react-intl';
import { i18n } from './index.tsx';

const string = '非函数内部字符串不提取';
const templateString = `非组件模板字符串不提取`;

const normalArrowFunction = () => {
  const name = i18n.intl.formatMessage({
    id: 'key0003',
    defaultMessage: '普通箭头函数字符串替换成全局',
  });
};
function normalFunction() {
  const name = i18n.intl.formatMessage({
    id: 'key0004',
    defaultMessage: '普通函数字符串替换成全局',
  });
}

const ArrowComponent = () => {
  const myIntl = useIntl();
  const name = myIntl.formatMessage({
    id: 'key0005',
    defaultMessage: '箭头函数组件字符串提取',
  });

  return (
    <div>
      <FormattedMessage
        id="key0006"
        defaultMessage="箭头函数组件{v1}jsx"
        values={{ v1: name }}
      />
    </div>
  );
};
function FunctionComponent(params = '参数无法提取') {
  const intl = useIntl();

  const name = intl.formatMessage({
    id: 'key0008',
    defaultMessage: '函数组件字符串提取',
  });

  return (
    <div>
      <FormattedMessage
        id="key0009"
        defaultMessage="函数组件{v1}jsx"
        values={{ v1: name }}
      />
    </div>
  );
}

import React from 'react';
import { useIntl, FormattedMessage } from 'react-intl';

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

import React from 'react';

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

function MegedFunction() {
  const name = '箭头函数组件字符串提取';
  const name2 = '张成思';
}

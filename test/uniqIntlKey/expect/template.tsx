import { useIntl } from 'react-intl';
import React from 'react';

function AA() {
  i18.intl.formatMessage(
    {
      id: 'key16Fr+KZ66AYWybh3TtL8IEw__',
      defaultMessage: '远控失败:{v1}',
    },
    { v1: res.msg }
  );
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

function MegedFunction() {
  const intl = useIntl();

  const name = intl.formatMessage({
    id: 'key0005',
    defaultMessage: '箭头函数组件字符串提取',
  });
  const name2 = intl.formatMessage({
    id: 'key1SGrp8OHiEjHihstWO61MQQ__',
    defaultMessage: '张成思',
  });
  const name3 = intl.formatMessage({
    id: 'key1SGrp8OHiEjHihstWO61MQQ__',
    defaultMessage: '张成思',
  });
  message.error({
    content: intl.formatMessage(
      {
        id: 'key16Fr+KZ66AYWybh3TtL8IEw__',
        defaultMessage: '远控失败:{v1}',
      },
      { v1: res.msg }
    ),
    key,
    duration: 3,
  });
}

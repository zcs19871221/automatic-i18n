import { FormattedMessage, useIntl } from 'react-intl';
// @ts-ignore
import React from 'react';

const AlarmSvg = () => (
  <div id="报警">
    <FormattedMessage id="key0001" defaultMessage="你好" />
  </div>
);

function Comp2() {
  const intl = useIntl();

  const hello = intl.formatMessage({
    id: 'key0001',
    defaultMessage: '你好',
  });
  return (
    <div
      id="再见"
      alt={intl.formatMessage({
        id: 'key0002',
        defaultMessage: '图片',
      })}
    >
      <FormattedMessage
        id="key0003"
        defaultMessage="我是{v1}"
        values={{ v1: hello }}
      />
    </div>
  );
}

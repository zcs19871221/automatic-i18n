/* eslint-disable react/jsx-curly-brace-presence */
/* eslint-disable no-console */
// @ts-nocheck
import { useIntl, FormattedMessage } from 'react-intl';
import React from 'react';
import { i18n } from './i18n/index.tsx';
export const name = i18n.intl.formatMessage({
  id: 'hellosdffdsfds',
  defaultMessage: '你好',
});

export const name = i18n.intl.formatMessage({
  id: 'hellosdffdsfds',
  defaultMessage: '你好',
});

export default function Component() {
  const intl = useIntl();

  const hah = intl.formatMessage({
    id: 'key0001',
    defaultMessage: '哈哈哈',
  });
  const x = intl.formatMessage({
    id: 'key0002',
    defaultMessage: '哈\\n  哈',
  });
  const hah2 = intl.formatMessage({
    id: 'key0003',
    defaultMessage: "'哈哈哈",
  });
  const v1 = intl.formatMessage({
    id: 'goodbye_1',
    defaultMessage: '再见',
  });
  return (
    <div>
      {i18n.intl.formatMessage({
        id: 'goodbye_1',
        defaultMessage: '再见',
      })}
      <span>
        <FormattedMessage
          id="key0004"
          defaultMessage="你好{v1}"
          values={{ v1 }}
        />
      </span>
    </div>
  );
}

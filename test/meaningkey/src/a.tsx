/* eslint-disable react/jsx-curly-brace-presence */
/* eslint-disable no-console */
// @ts-nocheck
import React from 'react';
import { i18n } from './i18n/index.tsx';
export const name = i18n.intl.formatMessage({
  id: 'key0001',
  defaultMessage: '你好',
});

export const name = i18n.intl.formatMessage({
  id: 'key0001',
  defaultMessage: '你好',
});

export default function Component() {
  const hah = '哈哈哈';
  const x =
    '哈\
  哈';
  const hah2 = "'哈哈哈";
  const hah2 = `哈哈
  哈哈`;
  const v1 = '再见';
  return (
    <div>
      {i18n.intl.formatMessage({
        id: 'key0002',
        defaultMessage: '再见',
      })}
      <span>你好{v1}</span>
    </div>
  );
}

export function MeaningKeyComponent() {
  return <FormattedMessage id="key0001" defaultMessage="你好" />;
}

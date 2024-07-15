/* eslint-disable react/jsx-curly-brace-presence */
/* eslint-disable no-console */
// @ts-nocheck
import { i18 } from 'I18';
import React from 'react';
export const name = i18.intl.formatMessage({
  id: 'key0001',
  defaultMessage: '你好',
});

export default function Component() {
  return (
    <div>
      {i18.intl.formatMessage({
        id: 'key0002',
        defaultMessage: '再见',
      })}
    </div>
  );
}

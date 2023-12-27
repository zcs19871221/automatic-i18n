import { i18 } from './';
// @ts-ignore
import React from 'react';

const flag = true;
const div1 = (
  <div name={<span>sdffds</span>}>
    hello{name}
    {i18.intl.formatMessage({ id: 'key0001' })}
    <h1>
      {i18.intl.formatMessage({ id: 'key0002' })}
      {flag
        ? i18.intl.formatMessage({ id: 'key0003' }, { v1: flag })
        : i18.intl.formatMessage({ id: 'key0004' })}
    </h1>
    {i18.intl.formatMessage({ id: 'key0005' })}
  </div>
);
export { div1 };

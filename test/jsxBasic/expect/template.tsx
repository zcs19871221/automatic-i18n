// @ts-nocheck
import { i18 } from './';
import React from 'react';

const name = 'sdffds';
const div1 = (
  <div>{i18.intl.formatMessage({ id: 'key0001' }, { v1: name })}</div>
);
const div2 = <div>sdffdsf{name}sdffds</div>;

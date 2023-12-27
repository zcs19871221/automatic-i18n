import { i18 } from './';
const name = 'name';
const age = 'name';
const rule = 'rule';
const what = 'what';
const end = 'end';

const x = i18.intl.formatMessage(
  { id: 'key0002' },
  {
    v1: rule,
    v2: name,
    v3: age ? i18.intl.formatMessage({ id: 'key0001' }, { v1: what }) : end,
    v4: name ? 'sdffds' : 'fdsfdf',
    v5: age > name ? 'hello' : 'fff',
  }
);

const y = `fdsffdfdhello${age ? rule : what}`;

export { x };

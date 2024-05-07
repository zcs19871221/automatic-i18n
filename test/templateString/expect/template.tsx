import { i18 } from './';
const name = 'name';
const age = 'name';
const rule = 'rule';
const what = 'what';
const end = 'end';

const x = i18.intl.formatMessage(
  {
    id: 'key0004',
    defaultMessage: 'fsffdsfd{v1}你好呀{v2}哈哈{v3}ffff{v4}{v5}xz{v2}',
  },
  {
    v1: rule,
    v2: name,
    v3: age
      ? i18.intl.formatMessage(
          {
            id: 'key0001',
            defaultMessage: '里面{v1}',
          },
          { v1: what }
        )
      : end,
    v4: name ? 'sdffds' : 'fdsfdf',
    v5:
      age > name
        ? i18.intl.formatMessage({
            id: 'key0002',
            defaultMessage: '你好',
          })
        : i18.intl.formatMessage({
            id: 'key0003',
            defaultMessage: '不好',
          }),
  }
);

const y = `fdsffdfdhello${age ? rule : what}`;

const z1 = `hello${
  age
    ? i18.intl.formatMessage({
        id: 'key0005',
        defaultMessage: '张三',
      })
    : what
}`;
const z2 = `hello${age ? 'ffff' : what}`;
const z3 = `hello${
  age
    ? i18.intl.formatMessage({
        id: 'key0006',
        defaultMessage: 's张三dsf',
      })
    : what
}`;

export { x };

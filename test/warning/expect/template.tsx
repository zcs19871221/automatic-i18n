/* auto-i18n-ignore-next */
import { i18n } from './index.tsx';
const variable: any = [];

/* auto-i18n-ignore-start */
if (variable === '发') {
}

if ('好' === variable) {
  const name = '张成思';
}
/* auto-i18n-ignore-end */
if ('忽略' === variable) {
}

['你', variable, '大'].includes(variable);
['他'].includes(variable);

const days = [
  i18n.intl.formatMessage({
    id: 'key0001',
    defaultMessage: '7月1日',
  }),
  i18n.intl.formatMessage({
    id: 'key0002',
    defaultMessage: '7月5日',
  }),
  i18n.intl.formatMessage({
    id: 'key0003',
    defaultMessage: '7月6日',
  }),
  i18n.intl.formatMessage({
    id: 'key0004',
    defaultMessage: '7月8日',
  }),
];

const willBeSkip = i18n.intl.formatMessage({
  id: 'key0005',
  defaultMessage: '忽略',
});
const notSkip = i18n.intl.formatMessage({
  id: 'key0005',
  defaultMessage: '忽略',
});

const obj = {
  /* auto-i18n-ignore-next */
  今天: [moment(), moment()],
  最近7天: [moment().subtract(6, 'days'), moment()],
  最近30天: [moment().subtract(29, 'days'), moment()],
};

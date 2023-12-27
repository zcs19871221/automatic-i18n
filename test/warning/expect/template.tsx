import { i18 } from './';
const variable: any = [];

if (variable === '发') {
}

if ('好' === variable) {
}

if (/* @ignore */ '忽略' === variable) {
}

['你', variable, '大'].includes(variable);
[/* @ignore */ '他'].includes(variable);

const days = [
  i18.intl.formatMessage({ id: 'key0001' }),
  i18.intl.formatMessage({ id: 'key0002' }),
  i18.intl.formatMessage({ id: 'key0003' }),
  i18.intl.formatMessage({ id: 'key0004' }),
];

const willBeSkip = /* @ignore */ '忽略';
const notSkip = i18.intl.formatMessage({ id: 'key0005' });

const obj = {
  今天 /* @ignore */: [moment(), moment()],
  最近7天: [moment().subtract(6, 'days'), moment()],
  最近30天: [moment().subtract(29, 'days'), moment()],
};

import { i18 } from './';
const variable: any = [];

if (variable === '发') {
}

if ('好' === variable) {
}

if ('忽略' /* @ignore */ === variable) {
}

['你', variable, '大'].includes(variable);
['他' /* @ignore */].includes(variable);

const days = [i18.locales.key0001, i18.locales.key0002, i18.locales.key0003, i18.locales.key0004];

const obj = {
  今天 /* @ignore */: [moment(), moment()],
  最近7天: [moment().subtract(6, 'days'), moment()],
  最近30天: [moment().subtract(29, 'days'), moment()],
};

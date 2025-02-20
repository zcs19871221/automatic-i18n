/* auto-i18n-ignore-next */
const variable: any = [];

/* auto-i18n-ignore-next */
if (variable === '发') {
}
/* auto-i18n-collect-start */
if ('好' === variable) {
}
/* automatic-i18n-ignore-next */
if ('忽略' === variable) {
}

['你', variable, '大'].includes(variable);
[/* @ignore */ '他'].includes(variable);

const days = ['7月1日', '7月5日', '7月6日', '7月8日'];

const willBeSkip = /* @ignore */ '忽略';
const notSkip = '忽略';

const obj = {
  今天 /* @ignore */: [moment(), moment()],
  最近7天: [moment().subtract(6, 'days'), moment()],
  最近30天: [moment().subtract(29, 'days'), moment()],
};

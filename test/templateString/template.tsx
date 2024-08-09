const name = 'name';
const age = 'name';
const rule = 'rule';
const what = 'what';
const end = 'end';

const x = `fsffdsfd${rule}你好呀${name}哈哈${age ? `里面${what}` : end}ffff${
  name ? 'sdffds' : 'fdsfdf'
}${age > name ? '你好' : '不好'}xz${name}`;

const y = `fdsffdfdhello${age ? rule : what}`;

const z1 = `hello${age ? '张三' : what}`;
const z2 = `hello${age ? 'ffff' : what}`;
const z3 = `hello${age ? `s张三dsf` : what}`;

export { x };

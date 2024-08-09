interface MyType {
  name: '张成思' | '你好';
}

type X = Record<'张成思' | '王五', string>;

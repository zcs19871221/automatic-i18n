// @ts-nocheck

const common = <>哈哈{name}你好</>;
const nest1 = (
  <div name="你好" age={<div>sd你好fs</div>}>
    <div>哈哈</div>哈哈{name}你好<div>你好</div>
    <span>你好{flag ? `哈哈${name}` : <h1>哈哈</h1>}</span>
    <span>你好{flag ? `哈哈${name}` : '哈哈'}</span>
    <span>
      准备{age}再见{age}
    </span>
    <span>{flag ? '再见' : `哈哈${name}`}</span>
    <span>{flag}</span>
    <span>flag</span>
    <span>   
          你好啊
      我很好
    </span>
    <span>{flag ? '再见' : `哈哈${name}`}</span>;
    <span
      className={css`
        margin-left: 20px;
      `}
      style={{
        width: '20px',
      }}
      name="张成思"
    />
  </div>
);

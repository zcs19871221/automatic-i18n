/* eslint-disable react/jsx-curly-brace-presence */
/* eslint-disable no-console */
// @ts-nocheck
import { useIntl, FormattedMessage } from 'react-intl';
import React from 'react';
import { i18n } from './index.tsx';

//@ts-ignore
// import file from './报告.doc'
// //@ts-ignore
// import file2 from "./报告.doc"

export default function commonFunc1() {
  const name2 = i18n.intl.formatMessage({
    id: 'key0001',
    defaultMessage: '王五',
  });
}

interface Custom<CustomT> {}
const name = '张成思';
const commonFunc = () => {
  const gender = i18n.intl.formatMessage({
    id: 'key0003',
    defaultMessage: '男',
  });
};

const commonFunc2 = function () {
  const name3 = i18n.intl.formatMessage({
    id: 'key0004',
    defaultMessage: '孙六',
  });
};
export function Comp1() {
  const intl = useIntl();

  const name4 = intl.formatMessage({
    id: 'key0005',
    defaultMessage: '孙孙',
  });
}
export const Comp4 = function Comp1() {
  const intl = useIntl();

  const name4 = intl.formatMessage({
    id: 'key0005',
    defaultMessage: '孙孙',
  });
};
const Comp5 = function () {
  const intl = useIntl();

  const name4 = intl.formatMessage({
    id: 'key0005',
    defaultMessage: '孙孙',
  });
};
export const App = ({
  name = '默认名称',
  flag,
}: {
  name: string;
  flag: boolean;
}) => {
  const intl = useIntl();

  const gender = intl.formatMessage({
    id: 'key0003',
    defaultMessage: '男',
  });
  const nested1 = intl.formatMessage(
    {
      id: 'key0010',
      defaultMessage: '{v1}北京大学',
    },
    {
      v1: intl.formatMessage(
        {
          id: 'key0009',
          defaultMessage: '  sffds你好{v1}哈哈{v2}为什么',
        },
        {
          v1: name,
          v2: gender
            ? intl.formatMessage({
                id: 'key0007',
                defaultMessage: '好的',
              })
            : intl.formatMessage({
                id: 'key0008',
                defaultMessage: '不好',
              }),
        }
      ),
    }
  );
  const nested2 = intl.formatMessage(
    {
      id: 'key0010',
      defaultMessage: '{v1}北京大学',
    },
    {
      v1:
        gender === '男'
          ? intl.formatMessage({
              id: 'key0011',
              defaultMessage: '真是男的',
            })
          : intl.formatMessage(
              {
                id: 'key0012',
                defaultMessage: '你好{v1}哈哈',
              },
              { v1: name }
            ),
    }
  );
  const school = intl.formatMessage(
    {
      id: 'key0013',
      defaultMessage: '北京{v1}大学',
    },
    { v1: name }
  );
  const school1 = intl.formatMessage(
    {
      id: 'key0010',
      defaultMessage: '{v1}北京大学',
    },
    { v1: name }
  );

  const school2 = intl.formatMessage(
    {
      id: 'key0016',
      defaultMessage: '北京大学{v1}真不错aaaa{v1}哈哈{v2}',
    },
    {
      v1: name,
      v2: flag
        ? intl.formatMessage(
            {
              id: 'key0014',
              defaultMessage: '套娃1{v1}套娃2',
            },
            { v1: school }
          )
        : intl.formatMessage({
            id: 'key0015',
            defaultMessage: '套娃3',
          }),
    }
  );
  const obj = {
    title: intl.formatMessage({
      id: 'key0017',
      defaultMessage: '租户不存在',
    }),
    content: intl.formatMessage({
      id: 'key0018',
      defaultMessage: '请重新登录，或联系系统管理员创建至少一个租户',
    }),
    okText: intl.formatMessage({
      id: 'key0019',
      defaultMessage: '知道了',
    }),
  };

  const flag2 = true;
  const x = intl.formatMessage({
    id: 'key0020',
    defaultMessage: '和`',
  });
  const noVariable = intl.formatMessage({
    id: 'key0021',
    defaultMessage: ' sfdsfds你好dsffds你好',
  });

  console.log(gender, school, school1, school2, obj, nested1, nested2);
  return (
    <div
      data-alias={intl.formatMessage({
        id: 'key0022',
        defaultMessage: '别名',
      })}
      data-alias2={intl.formatMessage({
        id: 'key0023',
        defaultMessage: '别名2',
      })}
      data-name={
        flag2
          ? intl.formatMessage({
              id: 'key0024',
              defaultMessage: '你好',
            })
          : name
      }
      data-name2={
        flag2
          ? intl.formatMessage({
              id: 'key0024',
              defaultMessage: '你好',
            })
          : intl.formatMessage(
              {
                id: 'key0025',
                defaultMessage: '意义咋样 {v1} : sffdsfd',
              },
              { v1: name }
            )
      }
      placeholder={intl.formatMessage({
        id: 'key0026',
        defaultMessage: '请输入',
      })}
      data-v1={intl.formatMessage(
        {
          id: 'key0027',
          defaultMessage: '你好{v1}哈哈{v2}为什么',
        },
        { v1: name, v2: gender }
      )}
      data-v2={intl.formatMessage({
        id: 'key0026',
        defaultMessage: '请输入',
      })}
    >
      <FormattedMessage
        id="key0031"
        defaultMessage="`${v1}html中纯文本`"
        values={{ v1: '' }}
      />

      {flag2 ? (
        <div>{'fdsfdf'}</div>
      ) : (
        <div>
          {flag2
            ? intl.formatMessage({
                id: 'key0024',
                defaultMessage: '你好',
              })
            : intl.formatMessage(
                {
                  id: 'key0028',
                  defaultMessage: '哈哈{v1}你好',
                },
                { v1: name }
              )}
        </div>
      )}

      <FormattedMessage
        id="key0032"
        defaultMessage="然后分割\n      {v1}然后分割"
        values={{ v1: name }}
      />

      <div>
        <FormattedMessage id="key0029" defaultMessage="fff空节点zzx空节点" />
      </div>
      <div>
        <FormattedMessage id="key0030" defaultMessage="空节点" />
      </div>
    </div>
  );
};

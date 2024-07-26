/* eslint-disable react/jsx-curly-brace-presence */
/* eslint-disable no-console */
// @ts-nocheck
import { i18n } from './index.tsx';
import React from 'react';
//@ts-ignore
// import file from './报告.doc'
// //@ts-ignore
// import file2 from "./报告.doc"
interface Custom<CustomT> {}
export const App = ({
  name = i18n.intl.formatMessage({
    id: 'key0001',
    defaultMessage: '默认名称',
  }),
  flag,
}: {
  name: string;
  flag: boolean;
}) => {
  const gender = i18n.intl.formatMessage({
    id: 'key0002',
    defaultMessage: '男',
  });
  const nested1 = i18n.intl.formatMessage(
    {
      id: 'key0006',
      defaultMessage: '{v1}北京大学',
    },
    {
      v1: i18n.intl.formatMessage(
        {
          id: 'key0005',
          defaultMessage: '  sffds你好{v1}哈哈{v2}为什么',
        },
        {
          v1: name,
          v2: gender
            ? i18n.intl.formatMessage({
                id: 'key0003',
                defaultMessage: '好的',
              })
            : i18n.intl.formatMessage({
                id: 'key0004',
                defaultMessage: '不好',
              }),
        }
      ),
    }
  );
  const nested2 = i18n.intl.formatMessage(
    {
      id: 'key0006',
      defaultMessage: '{v1}北京大学',
    },
    {
      v1:
        gender === '男'
          ? i18n.intl.formatMessage({
              id: 'key0007',
              defaultMessage: '真是男的',
            })
          : i18n.intl.formatMessage(
              {
                id: 'key0008',
                defaultMessage: '你好{v1}哈哈',
              },
              { v1: name }
            ),
    }
  );
  const school = i18n.intl.formatMessage(
    {
      id: 'key0009',
      defaultMessage: '北京{v1}大学',
    },
    { v1: name }
  );
  const school1 = i18n.intl.formatMessage(
    {
      id: 'key0006',
      defaultMessage: '{v1}北京大学',
    },
    { v1: name }
  );

  const school2 = i18n.intl.formatMessage(
    {
      id: 'key0012',
      defaultMessage: '北京大学{v1}真不错aaaa{v1}哈哈{v2}',
    },
    {
      v1: name,
      v2: flag
        ? i18n.intl.formatMessage(
            {
              id: 'key0010',
              defaultMessage: '套娃1{v1}套娃2',
            },
            { v1: school }
          )
        : i18n.intl.formatMessage({
            id: 'key0011',
            defaultMessage: '套娃3',
          }),
    }
  );
  const obj = {
    title: i18n.intl.formatMessage({
      id: 'key0013',
      defaultMessage: '租户不存在',
    }),
    content: i18n.intl.formatMessage({
      id: 'key0014',
      defaultMessage: '请重新登录，或联系系统管理员创建至少一个租户',
    }),
    okText: i18n.intl.formatMessage({
      id: 'key0015',
      defaultMessage: '知道了',
    }),
  };

  const flag2 = true;
  const x = i18n.intl.formatMessage({
    id: 'key0016',
    defaultMessage: '和`',
  });
  const noVariable = i18n.intl.formatMessage({
    id: 'key0017',
    defaultMessage: ' sfdsfds你好dsffds你好',
  });

  console.log(gender, school, school1, school2, obj, nested1, nested2);
  return (
    <div
      data-alias={i18n.intl.formatMessage({
        id: 'key0018',
        defaultMessage: '别名',
      })}
      data-alias2={i18n.intl.formatMessage({
        id: 'key0019',
        defaultMessage: '别名2',
      })}
      data-name={
        flag2
          ? i18n.intl.formatMessage({
              id: 'key0020',
              defaultMessage: '你好',
            })
          : name
      }
      data-name2={
        flag2
          ? i18n.intl.formatMessage({
              id: 'key0020',
              defaultMessage: '你好',
            })
          : i18n.intl.formatMessage(
              {
                id: 'key0021',
                defaultMessage: '意义咋样 {v1} : sffdsfd',
              },
              { v1: name }
            )
      }
      placeholder={i18n.intl.formatMessage({
        id: 'key0022',
        defaultMessage: '请输入',
      })}
      data-v1={i18n.intl.formatMessage(
        {
          id: 'key0023',
          defaultMessage: '你好{v1}哈哈{v2}为什么',
        },
        { v1: name, v2: gender }
      )}
      data-v2={i18n.intl.formatMessage({
        id: 'key0022',
        defaultMessage: '请输入',
      })}
    >
      {i18n.intl.formatMessage(
        {
          id: 'key0027',
          defaultMessage: '`${v1}html中纯文本`',
        },
        { v1: '' }
      )}
      {flag2 ? (
        <div>{'fdsfdf'}</div>
      ) : (
        <div>
          {flag2
            ? i18n.intl.formatMessage({
                id: 'key0020',
                defaultMessage: '你好',
              })
            : i18n.intl.formatMessage(
                {
                  id: 'key0024',
                  defaultMessage: '哈哈{v1}你好',
                },
                { v1: name }
              )}
        </div>
      )}
      {i18n.intl.formatMessage(
        {
          id: 'key0028',
          defaultMessage: '然后分割\n      {v1}然后分割',
        },
        { v1: name }
      )}
      <div>
        {i18n.intl.formatMessage({
          id: 'key0025',
          defaultMessage: 'fff空节点zzx空节点',
        })}
      </div>
      <div>
        {i18n.intl.formatMessage({
          id: 'key0026',
          defaultMessage: '空节点',
        })}
      </div>
    </div>
  );
};

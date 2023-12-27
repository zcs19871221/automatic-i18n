/* eslint-disable react/jsx-curly-brace-presence */
/* eslint-disable no-console */
// @ts-nocheck
import { i18 } from './';
import React from 'react';
//@ts-ignore
// import file from './报告.doc'
// //@ts-ignore
// import file2 from "./报告.doc"
interface Custom<CustomT> {}
export const App = ({
  name = i18.intl.formatMessage({ id: 'key0001' }),
  flag,
}: {
  name: string;
  flag: boolean;
}) => {
  const gender = i18.intl.formatMessage({ id: 'key0002' });
  const nested1 = i18.intl.formatMessage(
    { id: 'key0006' },
    {
      v1: i18.intl.formatMessage(
        { id: 'key0005' },
        {
          v1: name,
          v2: gender
            ? i18.intl.formatMessage({ id: 'key0003' })
            : i18.intl.formatMessage({ id: 'key0004' }),
        }
      ),
    }
  );
  const nested2 = i18.intl.formatMessage(
    { id: 'key0006' },
    {
      v1:
        gender === '男'
          ? i18.intl.formatMessage({ id: 'key0007' })
          : i18.intl.formatMessage({ id: 'key0008' }, { v1: name }),
    }
  );
  const school = i18.intl.formatMessage({ id: 'key0009' }, { v1: name });
  const school1 = i18.intl.formatMessage({ id: 'key0006' }, { v1: name });

  const school2 = i18.intl.formatMessage(
    { id: 'key0012' },
    {
      v1: name,
      v2: flag
        ? i18.intl.formatMessage({ id: 'key0010' }, { v1: school })
        : i18.intl.formatMessage({ id: 'key0011' }),
    }
  );
  const obj = {
    title: i18.intl.formatMessage({ id: 'key0013' }),
    content: i18.intl.formatMessage({ id: 'key0014' }),
    okText: i18.intl.formatMessage({ id: 'key0015' }),
  };

  const flag2 = true;
  const x = i18.intl.formatMessage({ id: 'key0016' });
  const noVariable = i18.intl.formatMessage({ id: 'key0017' });

  console.log(gender, school, school1, school2, obj, nested1, nested2);
  return (
    <div
      data-alias={i18.intl.formatMessage({ id: 'key0018' })}
      data-alias2={i18.intl.formatMessage({ id: 'key0019' })}
      data-name={flag2 ? i18.intl.formatMessage({ id: 'key0020' }) : name}
      data-name2={
        flag2
          ? i18.intl.formatMessage({ id: 'key0020' })
          : i18.intl.formatMessage({ id: 'key0021' }, { v1: name })
      }
      placeholder={i18.intl.formatMessage({ id: 'key0022' })}
      data-v1={i18.intl.formatMessage(
        { id: 'key0023' },
        { v1: name, v2: gender }
      )}
      data-v2={i18.intl.formatMessage({ id: 'key0022' })}
    >
      `${}
      {i18.intl.formatMessage({ id: 'key0024' })}
      {flag2 ? (
        <div>{'fdsfdf'}</div>
      ) : (
        <div>
          {flag2
            ? i18.intl.formatMessage({ id: 'key0020' })
            : i18.intl.formatMessage({ id: 'key0025' }, { v1: name })}
        </div>
      )}
      {i18.intl.formatMessage({ id: 'key0026' })}
      {name}
      {i18.intl.formatMessage({ id: 'key0026' })}
      <div>{i18.intl.formatMessage({ id: 'key0027' })}</div>
      <div>{i18.intl.formatMessage({ id: 'key0028' })}</div>
    </div>
  );
};

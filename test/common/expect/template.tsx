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
  name = i18.locales.key0001,
  flag,
}: {
  name: string;
  flag: boolean;
}) => {
  const gender = i18.locales.key0002;
  const nested1 = `${`  sffds${i18.locales.key0004}${name}${i18.locales.key0005}${
    gender ? i18.locales.key0007 : i18.locales.key0008
  }${i18.locales.key0006}`}${i18.locales.key0003}`;
  const nested2 = `${gender === '男' /* @ignore */ ? i18.locales.key0009 : `${i18.locales.key0004}${name}${i18.locales.key0005}`}${i18.locales.key0003}`;
  const school = `${i18.locales.key0010}${name}${i18.locales.key0011}`;
  const school1 = `${name}${i18.locales.key0003}`;

  const school2 = `${i18.locales.key0003}${name}${i18.locales.key0012}aaaa${name}${i18.locales.key0005}${
    flag ? `${i18.locales.key0013}1${school}${i18.locales.key0013}2` : i18.locales.key0014
  }`;
  const obj = {
    title: i18.locales.key0015,
    content: i18.locales.key0016,
    okText: i18.locales.key0017,
  };

  const flag2 = true;
  const x = i18.locales.key0018;
  const noVariable = i18.locales.key0019;

  console.log(gender, school, school1, school2, obj, nested1, nested2);
  return (
    <div
      data-alias={i18.locales.key0020}
      data-alias2={i18.locales.key0021}
      data-name={flag2 ? i18.locales.key0004 : name}
      data-name2={flag2 ? i18.locales.key0004 : `${i18.locales.key0022} ${name} : sffdsfd`}
      placeholder={i18.locales.key0023}
      data-v1={`${i18.locales.key0004}${name}${i18.locales.key0005}${gender}${i18.locales.key0006}`}
      data-v2={i18.locales.key0023}
    >
      `${}html{i18.locales.key0024}`
      {flag2 ? (
        <div>{'fdsfdf'}</div>
      ) : (
        <div>{flag2 ? i18.locales.key0004 : `${i18.locales.key0005}${name}${i18.locales.key0004}`}</div>
      )}
      {i18.locales.key0025}
      {name}{i18.locales.key0025}
      <div>fff{i18.locales.key0026}zzx{i18.locales.key0026}</div>
      <div>{i18.locales.key0026}</div>
    </div>
  );
};

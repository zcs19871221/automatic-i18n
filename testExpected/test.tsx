import { Locales } from './';
/* eslint-disable react/jsx-curly-brace-presence */
/* eslint-disable no-console */
//@ts-ignore
import React from 'react';
//@ts-ignore
// import file from './报告.doc'
// //@ts-ignore
// import file2 from "./报告.doc"
interface Custom<CustomT> {}
export const App = ({
  name = Locales.key0001,
  flag,
}: {
  name: string;
  flag: boolean;
}) => {
  const gender = Locales.key0002;
  const nested1 = `${`  ${Locales.key0004}${name}${Locales.key0005}${
    gender ? Locales.key0007 : Locales.key0008
  }${Locales.key0006}`}${Locales.key0003}`;
  const nested2 = `${gender === Locales.key0002 ? Locales.key0009 : `${Locales.key0010}${name}${Locales.key0005}`}${Locales.key0003}`;
  const school = `${Locales.key0011}${name}${Locales.key0012}`;
  const school1 = `${name}${Locales.key0003}`;

  const school2 = `${Locales.key0003}${name}${Locales.key0013}${name}${Locales.key0005}${
    flag ? `${Locales.key0014}${school}${Locales.key0015}` : Locales.key0016
  }`;
  const obj = {
    title: Locales.key0017,
    content: Locales.key0018,
    okText: Locales.key0019,
  };

  const flag2 = true;
  const x = Locales.key0020;
  const noVariable = Locales.key0021;
  console.log(gender, school, school1, school2, obj, nested1, nested2);
  return (
    <div
      data-alias={Locales.key0022}
      data-alias2={Locales.key0023}
      data-name={flag2 ? Locales.key0010 : name}
      data-name2={flag2 ? Locales.key0010 : `${Locales.key0024} ${name} : sffdsfd`}
      placeholder={Locales.key0025}
      data-v1={`${Locales.key0010}${name}${Locales.key0005}${gender}${Locales.key0006}`}
      data-v2={Locales.key0025}
    >
      `${}{Locales.key0026}`
      {flag2 ? (
        <div>{'fdsfdf'}</div>
      ) : (
        <div>{flag2 ? Locales.key0010 : `${Locales.key0005}${name}${Locales.key0010}`}</div>
      )}
      {Locales.key0027}
      {name}{Locales.key0027}
      <div>{Locales.key0028}</div>
      <div>{Locales.key0029}</div>
    </div>
  );
};

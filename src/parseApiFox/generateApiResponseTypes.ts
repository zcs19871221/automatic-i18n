type ApiJsonValue =
  | string
  | number
  | boolean
  | null
  | ApiJsonObject
  | ApiJsonArray;
interface ApiJsonObject {
  [key: string]: ApiJsonValue;
}
type ApiJsonArray = ApiJsonValue[];

interface ApiResponseTypeGenResult {
  typeDefinitionString: string;
  isCommonType: boolean;
  responseCommonDataTypeName: string;
  isCommonPagedList: boolean;
  responsePagedItemTypeName: string;
  responseTypeName: string;
}

/**
 * 解析 Apifox/Ajax 返回值 JSON，生成 TypeScript 类型定义及结构分析
 * 所有 interface 命名均为 `${rootName}Response${属性名}`，根类型为 `${rootName}Response`
 * 如果 ResponseData 对应内容为空，则输出 type 而不是 interface，且类型为 unknown
 */
function generateApiResponseTypes(
  value: ApiJsonValue,
  rootName = 'Root'
): ApiResponseTypeGenResult {
  const out: string[] = [];
  const prefix = rootName + 'Response';

  // 记录每个 interface 的属性和字段类型
  const interfaceProps: Record<string, Set<string>> = {};
  const interfaceFieldType: Record<string, Record<string, string>> = {};

  function cap(s: string): string {
    return s
      .replace(/[^A-Za-z0-9]+/g, ' ')
      .trim()
      .split(/\s+/)
      .map((p) => (p ? p[0].toUpperCase() + p.slice(1) : ''))
      .join('');
  }

  function makeInterfaceName(prop: string) {
    // 根类型
    if (!prop) return prefix;
    // 特殊处理 list
    if (prop === 'list') return `${prefix}ListItem`;
    return `${prefix}${cap(prop)}`;
  }

  function safeKey(k: string): string {
    return /^[A-Za-z_]\w*$/.test(k) ? k : JSON.stringify(k);
  }

  function infer(v: ApiJsonValue, prop: string): string {
    if (v === null) return 'null';
    if (Array.isArray(v)) {
      if (!v.length) return 'any[]';
      const allObj = v.every(
        (e) => e && typeof e === 'object' && !Array.isArray(e)
      );
      if (allObj) {
        // 合并字段
        const merged: ApiJsonObject = {};
        v.forEach((o) => {
          if (typeof o === 'object' && o !== null && !Array.isArray(o)) {
            Object.keys(o).forEach((k) => {
              if (!(k in merged)) merged[k] = o[k];
            });
          }
        });
        const name = makeInterfaceName(prop === 'list' ? 'ListItem' : prop);
        buildInterface(name, merged);
        return name + '[]';
      }
      const elemTypes = v.map((e) =>
        infer(e, prop === 'list' ? 'ListItem' : prop)
      );
      const unique = [...new Set(elemTypes)];
      return unique.length === 1
        ? unique[0].replace(/\[\]$/, '') + '[]'
        : '(' + unique.join(' | ') + ')[]';
    }
    const t = typeof v;
    if (t === 'string') return 'string';
    if (t === 'number') return 'number';
    if (t === 'boolean') return 'boolean';
    if (t === 'object' && v !== null) {
      const name = makeInterfaceName(prop);
      buildInterface(name, v as ApiJsonObject, name);
      return name;
    }
    return 'any';
  }

  function buildInterface(
    name: string,
    obj: ApiJsonObject,
    overrideName?: string
  ) {
    const exportName = overrideName || name;
    const keys = Object.keys(obj);
    // 如果内容为空，输出 type xxx = unknown
    if (keys.length === 0) {
      out.push(`export type ${exportName} = unknown;`);
      interfaceProps[exportName] = new Set();
      interfaceFieldType[exportName] = {};
      return;
    }
    const lines = [`export interface ${exportName} {`];
    interfaceProps[exportName] = new Set();
    interfaceFieldType[exportName] = {};
    Object.entries(obj).forEach(([k, v]) => {
      const fieldType = infer(v, k);
      lines.push(`  ${safeKey(k)}: ${fieldType};`);
      interfaceProps[exportName].add(k);
      interfaceFieldType[exportName][k] = fieldType;
    });
    lines.push('}');
    out.push(lines.join('\n'));
  }

  // 生成根类型
  const rootTypeName = prefix;
  infer(value, '');

  // 检查是否为通用类型
  let isCommonType = false;
  let responseData = '';
  let isCommonPagedList = false;
  let responseItem = '';

  // 判断 code, msg
  if (
    interfaceProps[rootTypeName] &&
    ['code', 'msg'].every((k) => interfaceProps[rootTypeName].has(k))
  ) {
    isCommonType = true;
    responseData = interfaceFieldType[rootTypeName]['data'];
    // 如果 data 是 interface 名称，检查是否为分页列表
    if (
      responseData &&
      interfaceProps[responseData] &&
      ['pageIndex', 'pageSize', 'total', 'list'].every((k) =>
        interfaceProps[responseData].has(k)
      )
    ) {
      isCommonPagedList = true;
      // list 字段类型如 T[] 或 SomeType[]
      const listType = interfaceFieldType[responseData]['list'];
      const match = listType && listType.match(/^([A-Za-z0-9_]+)\[\]$/);
      if (match && interfaceProps[match[1]]) {
        responseItem = match[1];
      }
    }
  }

  return {
    typeDefinitionString: out.join('\n\n'),
    isCommonType,
    responseCommonDataTypeName: responseData,
    isCommonPagedList,
    responsePagedItemTypeName: responseItem,
    responseTypeName: rootTypeName,
  };
}

export { generateApiResponseTypes, ApiResponseTypeGenResult };

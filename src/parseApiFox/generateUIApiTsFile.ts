import { GenerateApiTsFileOptions } from './types';

export default function generateUIApiTsFile({
  responseTs,
  request,
  contentType,
}: GenerateApiTsFileOptions): string {
  // 类型定义部分
  let typeDefs = [
    responseTs.typeDefinitionString,
    request.requestTypeDefinition,
  ]
    .filter(Boolean)
    .join('\n\n');

  // 如果是下载接口，去掉 export type xxx = unknown;
  if (contentType === 'binary' && responseTs.responseTypeName) {
    const typeUnknownReg = new RegExp(
      `export type ${responseTs.responseTypeName} = unknown;\\s*`,
      'g'
    );
    typeDefs = typeDefs.replace(typeUnknownReg, '');
  }

  // import 部分
  const importLines: string[] = [];
  const methodLower = request.method.toLowerCase();
  const methodCap = methodLower.charAt(0).toUpperCase() + methodLower.slice(1);

  // 参数类型名
  const paramTypeNames: string[] = [];
  if (request.pathKey.length > 0) paramTypeNames.push(request.name + 'Path');
  if (request.queryTypeName) paramTypeNames.push(request.queryTypeName);
  if (request.bodyTypeName) paramTypeNames.push(request.bodyTypeName);

  let paramType = '';
  if (paramTypeNames.length === 1) {
    paramType = paramTypeNames[0];
  } else if (paramTypeNames.length > 1) {
    paramType = paramTypeNames.join(' & ');
  }

  // url部分
  const url = `'${request.path}'`;
  const urlWithPrefix = `'/bff/eh/rest${request.path}'`;

  let swrType = '';
  let useFn = '';
  let needSwrImport = false;
  // 只有存在data属性时才生成 useXXX
  if (
    contentType !== 'binary' &&
    responseTs.isCommonType &&
    responseTs.responseCommonDataTypeName
  ) {
    if (responseTs.isCommonPagedList && responseTs.responsePagedItemTypeName) {
      swrType = `PagedResponse<${responseTs.responsePagedItemTypeName}>`;
    } else {
      swrType = responseTs.responseCommonDataTypeName;
    }
    useFn = `
export const use${methodCap}${request.name} = (${
      paramType ? 'params: ' + paramType : ''
    }) =>
  use${methodCap}AppSwr<${swrType}>({
    url: ${url},
    params,
  });
`;
    needSwrImport = true;
  }

  if (contentType === 'binary') {
    importLines.push(`import { ensureDownload } from 'Mid/defaultConnector';`);
  } else {
    importLines.push(
      `import { ensure${methodCap}, ${methodLower} } from 'Mid/defaultConnector';`
    );
    if (needSwrImport) {
      importLines.push(`import { use${methodCap}AppSwr } from 'Mid/useSwr';`);
    }
    // 只有在 swrType 包含 PagedResponse 时才导入
    if (swrType.startsWith('PagedResponse<')) {
      importLines.push(`import { PagedResponse } from 'Uti/types';`);
    }
  }

  // getXXX 或 postXXX 函数
  let reqFn = '';
  if (contentType !== 'binary') {
    reqFn = `
export const ${methodLower}${request.name} = (${
      paramType ? 'params: ' + paramType : ''
    }): Promise<${responseTs.responseTypeName}> =>
  ${methodLower}(${urlWithPrefix}, params);
`;
  }

  // ensureGetXXX 或 ensurePostXXX 函数
  let ensureFn = '';
  if (contentType !== 'binary' && responseTs.isCommonType) {
    ensureFn = `
export const ensure${methodCap}${request.name} = (${
      paramType ? 'params: ' + paramType : ''
    }): Promise<${responseTs.responseCommonDataTypeName}> =>
  ensure${methodCap}(${urlWithPrefix}, params);
`;
  }

  // ensureDownloadXXX 函数
  let downloadFn = '';
  if (contentType === 'binary') {
    downloadFn = `
export const ensureDownload${request.name} = (${
      paramType ? 'params: ' + paramType : ''
    }) =>
  ensureDownload(${urlWithPrefix}, params);
`;
  }

  // 拼接所有内容
  let result = [
    importLines.join('\n'),
    '',
    typeDefs,
    '',
    useFn.trim(),
    reqFn.trim(),
    ensureFn.trim(),
    downloadFn.trim(),
  ]
    .filter(Boolean)
    .join('\n\n');

  // 去掉多余空行
  result = result.replace(/\n{3,}/g, '\n\n');

  return result.trim();
}

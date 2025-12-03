import path from 'path';
import * as fs from 'fs-extra';
import { GenerateApiTsFileOptions } from './types';

function getDomainHost(domain: string): string {
  if (domain.includes('system')) return '${this.env.ehSystemHost}';
  if (domain.includes('asset')) return '${this.env.ehAssetHost}';
  if (domain.includes('energy')) return '${this.env.ehEnergyHost}';
  return '${this.env.ehSystemHost}';
}

function buildUrl(
  pathStr: string,
  queryKeys: string[],
  domain: string,
  method: string,
  contentType: string
): string {
  let url = pathStr.replace(/\{(\w+)\}/g, (_, k) => `\${variables.${k}}`);
  url = `http://${getDomainHost(domain)}${url}`;
  if (
    (method.toLowerCase() === 'post' || contentType.includes('binary')) &&
    queryKeys.length > 0
  ) {
    const queryStr = queryKeys.map((k) => `${k}=\${variables.${k}}`).join('&');
    url += url.includes('?') ? '&' : '?';
    url += queryStr;
  }
  return url;
}

function restfulTemplate(): string {
  return `
import { Auth, BaseAuthContext, PermissionCodes } from '../authorization';
import { Variables, GqlContext } from '../types';

class GeneralRestful extends BaseAuthContext {
}

export default GeneralRestful.init();
`.trim();
}

function dataSourceTemplate(): string {
  return `
import BaseDataSource from '../dataSources/baseDataSource';
import { ApiEnv } from '../dataSources/types';
import { Variables } from '../types';

export default class GeneralDataSource extends BaseDataSource {
  env: ApiEnv;
  constructor(env: ApiEnv) {
    super();
    this.env = env;
  }
}
`.trim();
}

export default function generateBffApiTsFile(
  params: GenerateApiTsFileOptions & { bffDist: string }
) {
  const { bffDist, request, contentType, domain } = params;
  const restfulPath = path.join(bffDist, 'restful.ts');
  const dataSourcePath = path.join(bffDist, 'dataSource.ts');

  // restful.ts
  let restfulCode = '';
  if (fs.existsSync(restfulPath)) {
    restfulCode = fs.readFileSync(restfulPath, 'utf-8');
  } else {
    restfulCode = restfulTemplate();
  }

  // dataSource.ts
  let dataSourceCode = '';
  if (fs.existsSync(dataSourcePath)) {
    dataSourceCode = fs.readFileSync(dataSourcePath, 'utf-8');
  } else {
    dataSourceCode = dataSourceTemplate();
  }

  // 生成成员函数名，直接用 path 去掉开头的 /
  const funcName = request.path.replace(/^\//, '');

  // 检查 restful.ts 是否已存在该函数
  const restfulFuncPattern = new RegExp(`'${funcName}'\\s*\\(`);
  const restfulAlreadyExists = restfulFuncPattern.test(restfulCode);

  const restfulFuncDef = `
  // @Auth(PermissionCodes[])
  '${funcName}'(
    root: any,
    variables: Variables,
    ctx: GqlContext
  ) {
    return ctx.dataSources.generalDataSource['${funcName}'](variables);
  }
`;

  // restful.ts插入成员函数（如未重复）
  if (!restfulAlreadyExists) {
    const classMatch = restfulCode.match(
      /class\s+GeneralRestful\s+extends\s+BaseAuthContext\s*{([\s\S]*?)}/
    );
    if (classMatch) {
      restfulCode = restfulCode.replace(
        /class\s+GeneralRestful\s+extends\s+BaseAuthContext\s*{([\s\S]*?)}/,
        `class GeneralRestful extends BaseAuthContext {${restfulFuncDef}$1}`
      );
    }
  }

  // 检查 dataSource.ts 是否已存在该函数
  const dsFuncPattern = new RegExp(`async\\s+'${funcName}'\\s*\\(`);
  const dsAlreadyExists = dsFuncPattern.test(dataSourceCode);

  // dataSource.ts插入成员函数（如未重复）
  let dsFuncDef = '';
  if (!dsAlreadyExists) {
    let method = request.method.toLowerCase();
    if (contentType && contentType.includes('binary')) {
      method = 'download';
    }
    const url = buildUrl(
      request.rawPath,
      request.queryKey,
      domain || '',
      method,
      contentType || ''
    );
    dsFuncDef = `
  async '${funcName}'(variables: Variables) {
    return this.${method}(\`${url}\`, variables);
  }
`;
    // 插入到构造函数后
    const dsClassMatch = dataSourceCode.match(
      /constructor\(env: ApiEnv\)\s*{[\s\S]*?}\s*/
    );
    if (dsClassMatch) {
      const insertPos = dsClassMatch.index! + dsClassMatch[0].length;
      dataSourceCode =
        dataSourceCode.slice(0, insertPos) +
        dsFuncDef +
        dataSourceCode.slice(insertPos);
    }
  }

  return {
    restful: restfulCode.trim(),
    dataSource: dataSourceCode.trim(),
  };
}

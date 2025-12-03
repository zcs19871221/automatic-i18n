export type CurlParseResult = {
  method: string;
  url: string;
  requestTypeDefinition: string;
  queryTypeName: string;
  bodyTypeName: string;
  name: string;
  path: string;
  pathKey: string[];
  queryKey: string[];
  searchKey: string[];
  rawPath: string;
};

function inferPrimitive(v: string): string {
  if (/^\d+(\.\d+)?$/.test(v)) return 'number';
  if (/^(true|false)$/i.test(v)) return 'boolean';
  return 'string';
}

function inferValueType(v: any): string {
  if (v === null) return 'null';
  if (Array.isArray(v)) {
    if (!v.length) return 'any[]';
    const elemTypes = [...new Set(v.map(inferValueType))];
    return elemTypes.length === 1
      ? elemTypes[0].replace(/\[\]$/, '') + '[]'
      : 'any[]';
  }
  switch (typeof v) {
    case 'number':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'string':
      return 'string';
    case 'object':
      return buildInline(v);
    default:
      return 'any';
  }
}

function buildInline(o: Record<string, any>): string {
  const keys = Object.keys(o);
  if (!keys.length) return '{}';
  return (
    '{ ' + keys.map((k) => `${k}: ${inferValueType(o[k])};`).join(' ') + ' }'
  );
}

function buildExportInterface(obj: Record<string, any>, name: string): string {
  const lines = [`export interface ${name} {`];
  Object.keys(obj).forEach((k) => {
    lines.push(`  ${k}: ${inferValueType(obj[k])};`);
  });
  lines.push('}');
  return lines.join('\n');
}

function inferName(path: string, suffix: string): string {
  if (!path) return 'Unknown' + suffix;
  const segs = path.split('/').filter((s) => s && !/^{.*}$/.test(s));
  const core = segs.slice(-2).join('-') || segs.slice(-1)[0] || 'Data';
  return (
    core
      .replace(/[-_]+/g, ' ')
      .split(' ')
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join('') + suffix
  );
}

export function parseCurl(curlText: string, rawPath: string): CurlParseResult {
  const joined = curlText.replace(/\r/g, '');

  // Method
  let method = 'GET';
  const mMethod =
    joined.match(/--request\s+([A-Z]+)/i) || joined.match(/\s-X\s+([A-Z]+)/);
  if (mMethod) method = mMethod[1].toUpperCase();

  // URL
  let url = '';
  const mUrlPrimary = joined.match(/--request\s+[A-Z]+\s+['"]([^'"]+)['"]/);
  if (mUrlPrimary) {
    url = mUrlPrimary[1];
  } else {
    const mUrlFallback =
      joined.match(/['"](\/api[^'"]+)['"]/) ||
      joined.match(/['"](https?:\/\/[^'"]+)['"]/);
    if (mUrlFallback) url = mUrlFallback[1];
  }

  // Path & PathKey
  let path = '';
  let pathKey: string[] = [];
  if (rawPath) {
    path = rawPath
      .replace(/\{[^}]+\}/g, '')
      .replace(/\/+/g, '/')
      .replace(/\/$/, '');
    const paramMatches = rawPath.match(/\{([^}]+)\}/g);
    if (paramMatches) {
      pathKey = paramMatches.map((m) => m.replace(/[{}]/g, ''));
    }
  } else {
    path = url
      .replace(/\{[^}]+\}/g, '')
      .replace(/\/+/g, '/')
      .replace(/\/$/, '');
    const paramMatches = url.match(/\{([^}]+)\}/g);
    if (paramMatches) {
      pathKey = paramMatches.map((m) => m.replace(/[{}]/g, ''));
    }
  }

  // Query
  let queryTypeName = '';
  let queryTypeDef = '';
  let queryKey: string[] = [];
  let searchKey: string[] = [];
  if (url.includes('?')) {
    const qs = url.split('?')[1];
    const params: Record<string, string> = {};
    qs.split('&').forEach((p) => {
      if (!p) return;
      const [k, v = ''] = p.split('=');
      if (!k) return;
      params[k] = inferPrimitive(v);
      queryKey.push(k);
      searchKey.push(k);
    });
    queryTypeName = inferName(path, 'Query');
    queryTypeDef = buildExportInterface(params, queryTypeName);
  }

  // Body
  let bodyTypeName = '';
  let bodyTypeDef = '';
  const mBody =
    joined.match(/--data-raw\s+'({[\s\S]*?})'/) ||
    joined.match(/--data\s+'({[\s\S]*?})'/) ||
    joined.match(/-d\s+'({[\s\S]*?})'/);
  if (mBody) {
    let raw = mBody[1];
    raw = raw.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
    try {
      const obj = JSON.parse(raw);
      bodyTypeName = inferName(path, 'RequestBody');
      bodyTypeDef = buildExportInterface(obj, bodyTypeName);
    } catch {
      bodyTypeDef = '';
    }
  }

  // Path interface
  let pathTypeDef = '';
  if (pathKey.length > 0) {
    const pathTypeName = inferName(path, 'Path');
    const pathObj: Record<string, string> = {};
    pathKey.forEach((k) => (pathObj[k] = 'string'));
    pathTypeDef = buildExportInterface(pathObj, pathTypeName);
  }

  // 合并 requestTypeDefinition
  let requestTypeDefinition = '';
  [pathTypeDef, queryTypeDef, bodyTypeDef].filter(Boolean).forEach((def) => {
    requestTypeDefinition += def + '\n\n';
  });
  requestTypeDefinition = requestTypeDefinition.trim();

  return {
    method,
    url,
    requestTypeDefinition,
    queryTypeName,
    bodyTypeName,
    name: inferName(path, ''),
    path,
    pathKey,
    queryKey,
    searchKey,
    rawPath,
  };
}

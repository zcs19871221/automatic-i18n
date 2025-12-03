import { fetch, fetchJson } from './fetch';
import {
  generateApiResponseTypes,
  ApiResponseTypeGenResult,
} from './generateApiResponseTypes';

import { CurlParseResult, parseCurl } from './parseCurl';
import { GenerateApiTsFile } from './types';
import generateApiFile from './generateApiTsFile';

function traverse(
  obj: any,
  cb: (item: any, parent: any, key: string | number) => boolean | void,
  parent: any = null,
  keyOrIndex: number | string = ''
): void {
  cb(obj, parent, keyOrIndex);
  if (Array.isArray(obj)) {
    for (let index = 0; index < obj.length; index++) {
      traverse(obj[index], cb, obj, index);
    }
    return;
  }
  if (typeof obj === 'object' && obj !== null) {
    for (const key of Object.keys(obj)) {
      traverse(obj[key], cb, obj, key);
    }
    return;
  }
}

function isJson(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

function extractApiPath(html: string): string[] {
  const regex =
    /<span[^>]*class="cursor-pointer[^"]*"[^>]*>(\/api\/[^\<]+)<\/span>/g;
  const result: string[] = [];
  let match;
  while ((match = regex.exec(html)) !== null) {
    result.push(match[1]);
  }
  return result;
}

export default async function main({
  url,
  generateApiTsFileMethod = generateApiFile,
  extraOptionsForGeneration,
}: {
  url: string | string[];
  generateApiTsFileMethod?: GenerateApiTsFile;
  extraOptionsForGeneration?: any;
}) {
  const urls = Array.isArray(url) ? url : [url];
  for (const singleUrl of urls) {
    const match = singleUrl.match(/api-(\d+)$/);
    if (!match) {
      console.error('URL格式错误，必须以 api-数字 结尾，例如 .../api-3485318');
      process.exit(1);
    }
    const api = await fetchJson(singleUrl);
    const html = await fetch(singleUrl);
    let path = extractApiPath(html)[0];
    let responseTs: ApiResponseTypeGenResult | undefined;
    let request: CurlParseResult | undefined;
    let domain = '';
    let responseObj = {};
    let contentType = '';
    let curl = '';
    let pathTag: any;
    traverse(api, (item, parent, index) => {
      if (item === 'responses' && Array.isArray(parent)) {
        for (let i = Number(index) + 1; i < parent.length; i++) {
          const siblingItem = parent[i];
          if (
            typeof siblingItem === 'string' &&
            siblingItem.startsWith('{') &&
            isJson(siblingItem)
          ) {
            responseObj = JSON.parse(siblingItem);
            return true;
          }
        }
      }

      if (item === 'siteName' && Array.isArray(parent)) {
        domain = parent[Number(index) - 1];
      }

      if (item === 'contentType' && Array.isArray(parent)) {
        contentType = parent[Number(index) + 1];
      }
      if (typeof item === 'string' && item.startsWith('curl --location')) {
        curl = item;
      }
    });

    if (Array.isArray(path)) {
      pathTag = path[0];
    }
    request = parseCurl(curl, path);
    if (!path) {
      traverse(api, (item, parent, index) => {
        if (Array.isArray(item) && item.length === 1 && item[0] === pathTag) {
          if (
            parent[Number(index) - 1].startsWith(
              request?.path.slice(0, request.path.lastIndexOf('/'))
            )
          ) {
            path = parent[Number(index) - 1];
          }
        }
      });
      request = parseCurl(curl, path);
    }

    responseTs = generateApiResponseTypes(responseObj, request?.name);

    await generateApiTsFileMethod({
      responseTs,
      request,
      contentType,
      extraOptionsForGeneration,
      url: singleUrl,
      domain,
    });
  }
}

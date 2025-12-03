import { ApiResponseTypeGenResult } from './generateApiResponseTypes';
import { CurlParseResult } from './parseCurl';

export interface GenerateApiTsFileOptions {
  responseTs: ApiResponseTypeGenResult;
  request: CurlParseResult;
  contentType?: string;
  extraOptionsForGeneration?: any;
  url: string;
  domain: string;
}

export type GenerateApiTsFile = (params: GenerateApiTsFileOptions) => void;

// https://apifox.t.energymost.com/apidoc/docs-site/6000016/api-3477847
import { ensureGet, get } from 'Mid/defaultConnector';
import { useGetAppSwr } from 'Mid/useSwr';

export interface V2ListResponseData {
  id: number;
  name: string;
  type: string;
  status: number;
  parentId: number;
  templateId: number;
  templateType: string;
  iconKey: string;
  hierarchyTemplateId: number;
  labels: string[];
  privilege: boolean;
  fullPath: string;
  code: string;
  orderIndex: number;
  licensingStatus: null;
  site: boolean;
}

export interface V2ListResponse {
  code: string;
  data: V2ListResponseData[];
  msg: string;
}

export interface V2ListPath {
  customerId: string;
}

export interface V2ListQuery {
  treeType: string;
  type: string;
}

export const useGetV2List = (params: V2ListPath & V2ListQuery) =>
  useGetAppSwr<V2ListResponseData[]>({
    url: '/api/hierarchy/v2/list',
    params,
  });

export const getV2List = (
  params: V2ListPath & V2ListQuery
): Promise<V2ListResponse> => get('/bff/eh/rest/api/hierarchy/v2/list', params);

export const ensureGetV2List = (
  params: V2ListPath & V2ListQuery
): Promise<V2ListResponseData[]> =>
  ensureGet('/bff/eh/rest/api/hierarchy/v2/list', params);

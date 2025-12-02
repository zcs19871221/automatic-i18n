// https://apifox.t.energymost.com/apidoc/docs-site/6000016/api-3477954
import { ensureGet, get } from 'Mid/defaultConnector';
import { useGetAppSwr } from 'Mid/useSwr';

export interface HierarchyListResponseData {}

export interface HierarchyListResponse {
  code: string;
  data: HierarchyListResponseData[];
  msg: string;
}

export interface HierarchyListPath {
  customerId: string;
}

export interface HierarchyListQuery {
  treeType: string;
  type: string;
  customerId: string;
}

export const useGetHierarchyList = (
  params: HierarchyListPath & HierarchyListQuery
) =>
  useGetAppSwr<HierarchyListResponseData[]>({
    url: '/api/hierarchy/list',
    params,
  });

export const getHierarchyList = (
  params: HierarchyListPath & HierarchyListQuery
): Promise<HierarchyListResponse> =>
  get('/bff/eh/rest/api/hierarchy/list', params);

export const ensureGetHierarchyList = (
  params: HierarchyListPath & HierarchyListQuery
): Promise<HierarchyListResponseData[]> =>
  ensureGet('/bff/eh/rest/api/hierarchy/list', params);

// https://apifox.t.energymost.com/apidoc/docs-site/6000016/api-3485316
import { ensurePost, post } from 'Mid/defaultConnector';
import { usePostAppSwr } from 'Mid/useSwr';
import { PagedResponse } from 'Uti/types';

export interface DebuggingPhaseSiteDetailResponseListItem {
  siteId: number;
  siteName: string;
  usedDirectedAum: number;
}

export interface DebuggingPhaseSiteDetailResponseData {
  currentPage: number;
  list: DebuggingPhaseSiteDetailResponseListItem[];
  pageIndex: number;
  pageSize: number;
  pageTotal: number;
  total: number;
  totalCount: number;
  totalPage: number;
}

export interface DebuggingPhaseSiteDetailResponse {
  code: string;
  data: DebuggingPhaseSiteDetailResponseData;
  msg: string;
}

export interface DebuggingPhaseSiteDetailPath {
  customerId: string;
}

export interface DebuggingPhaseSiteDetailRequestBody {
  filterKey: string;
  filterValue: string[];
  pageIndex: number;
  pageSize: number;
  sortKey: string;
  sortOrder: string;
}

export const usePostDebuggingPhaseSiteDetail = (
  params: DebuggingPhaseSiteDetailPath & DebuggingPhaseSiteDetailRequestBody
) =>
  usePostAppSwr<PagedResponse<DebuggingPhaseSiteDetailResponseListItem>>({
    url: '/api/licensing/debuggingPhase/siteDetail',
    params,
  });

export const postDebuggingPhaseSiteDetail = (
  params: DebuggingPhaseSiteDetailPath & DebuggingPhaseSiteDetailRequestBody
): Promise<DebuggingPhaseSiteDetailResponse> =>
  post('/bff/eh/rest/api/licensing/debuggingPhase/siteDetail', params);

export const ensurePostDebuggingPhaseSiteDetail = (
  params: DebuggingPhaseSiteDetailPath & DebuggingPhaseSiteDetailRequestBody
): Promise<DebuggingPhaseSiteDetailResponseData> =>
  ensurePost('/bff/eh/rest/api/licensing/debuggingPhase/siteDetail', params);

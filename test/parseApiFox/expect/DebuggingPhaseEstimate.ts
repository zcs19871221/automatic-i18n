// https://apifox.t.energymost.com/apidoc/docs-site/6000016/api-3485315
import { ensurePost, post } from 'Mid/defaultConnector';
import { usePostAppSwr } from 'Mid/useSwr';

export interface DebuggingPhaseEstimateResponseData {
  commonAum: number;
  siteAum: number;
}

export interface DebuggingPhaseEstimateResponse {
  code: string;
  data: DebuggingPhaseEstimateResponseData;
  msg: string;
}

export interface DebuggingPhaseEstimatePath {
  customerId: string;
}

export interface DebuggingPhaseEstimateQuery {
  siteAumCount: string;
}

export const usePostDebuggingPhaseEstimate = (
  params: DebuggingPhaseEstimatePath & DebuggingPhaseEstimateQuery
) =>
  usePostAppSwr<DebuggingPhaseEstimateResponseData>({
    url: '/api/licensing/debuggingPhase/estimate',
    params,
  });

export const postDebuggingPhaseEstimate = (
  params: DebuggingPhaseEstimatePath & DebuggingPhaseEstimateQuery
): Promise<DebuggingPhaseEstimateResponse> =>
  post('/bff/eh/rest/api/licensing/debuggingPhase/estimate', params);

export const ensurePostDebuggingPhaseEstimate = (
  params: DebuggingPhaseEstimatePath & DebuggingPhaseEstimateQuery
): Promise<DebuggingPhaseEstimateResponseData> =>
  ensurePost('/bff/eh/rest/api/licensing/debuggingPhase/estimate', params);

// https://apifox.t.energymost.com/apidoc/docs-site/6000016/api-3485318
import { ensureGet, get } from 'Mid/defaultConnector';
import { useGetAppSwr } from 'Mid/useSwr';

export interface DebuggingPhaseVerifySerialNumberResponseData {
  lastingMonthly: number;
  pendingActivationCommonAum: number;
  pendingActivationSiteAum: number;
  remainingCommonAum: number;
  remainingSiteAum: number;
  serialNumber: string;
  totalCommonAum: number;
  totalSiteAum: number;
  validOrNot: boolean;
  remainingDirectedAndCommonAum: number;
}

export interface DebuggingPhaseVerifySerialNumberResponse {
  code: string;
  data: DebuggingPhaseVerifySerialNumberResponseData;
  msg: string;
}

export interface DebuggingPhaseVerifySerialNumberPath {
  customerId: string;
}

export interface DebuggingPhaseVerifySerialNumberQuery {
  serialNumber: string;
}

export const useGetDebuggingPhaseVerifySerialNumber = (
  params: DebuggingPhaseVerifySerialNumberPath &
    DebuggingPhaseVerifySerialNumberQuery
) =>
  useGetAppSwr<DebuggingPhaseVerifySerialNumberResponseData>({
    url: '/api/licensing/debuggingPhase/verifySerialNumber',
    params,
  });

export const getDebuggingPhaseVerifySerialNumber = (
  params: DebuggingPhaseVerifySerialNumberPath &
    DebuggingPhaseVerifySerialNumberQuery
): Promise<DebuggingPhaseVerifySerialNumberResponse> =>
  get('/bff/eh/rest/api/licensing/debuggingPhase/verifySerialNumber', params);

export const ensureGetDebuggingPhaseVerifySerialNumber = (
  params: DebuggingPhaseVerifySerialNumberPath &
    DebuggingPhaseVerifySerialNumberQuery
): Promise<DebuggingPhaseVerifySerialNumberResponseData> =>
  ensureGet(
    '/bff/eh/rest/api/licensing/debuggingPhase/verifySerialNumber',
    params
  );

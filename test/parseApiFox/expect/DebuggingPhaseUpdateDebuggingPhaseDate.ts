// https://apifox.t.energymost.com/apidoc/docs-site/6000016/api-3485317
import { ensurePost, post } from 'Mid/defaultConnector';

export interface DebuggingPhaseUpdateDebuggingPhaseDateResponse {
  code: string;
  msg: string;
}

export interface DebuggingPhaseUpdateDebuggingPhaseDatePath {
  customerId: string;
}

export interface DebuggingPhaseUpdateDebuggingPhaseDateQuery {
  debuggingPhaseDate: string;
}

export const postDebuggingPhaseUpdateDebuggingPhaseDate = (
  params: DebuggingPhaseUpdateDebuggingPhaseDatePath &
    DebuggingPhaseUpdateDebuggingPhaseDateQuery
): Promise<DebuggingPhaseUpdateDebuggingPhaseDateResponse> =>
  post(
    '/bff/eh/rest/api/licensing/debuggingPhase/updateDebuggingPhaseDate',
    params
  );

export const ensurePostDebuggingPhaseUpdateDebuggingPhaseDate = (
  params: DebuggingPhaseUpdateDebuggingPhaseDatePath &
    DebuggingPhaseUpdateDebuggingPhaseDateQuery
): Promise<undefined> =>
  ensurePost(
    '/bff/eh/rest/api/licensing/debuggingPhase/updateDebuggingPhaseDate',
    params
  );

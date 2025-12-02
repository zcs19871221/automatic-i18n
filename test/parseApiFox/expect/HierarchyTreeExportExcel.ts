// https://apifox.t.energymost.com/apidoc/docs-site/6000016/api-3482571
import { ensureDownload } from 'Mid/defaultConnector';

export interface HierarchyTreeExportExcelQuery {
  tagExport: string;
}

export const ensureDownloadHierarchyTreeExportExcel = (
  params: HierarchyTreeExportExcelQuery
) =>
  ensureDownload('/bff/eh/rest/api/system/hierarchyTree/exportExcel', params);

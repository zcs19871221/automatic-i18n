import BaseDataSource from '../dataSources/baseDataSource';
import { ApiEnv } from '../dataSources/types';
import { Variables } from '../types';

export default class GeneralDataSource extends BaseDataSource {
  env: ApiEnv;
  constructor(env: ApiEnv) {
    super();
    this.env = env;
  }

  async 'api/hierarchy/list'(variables: Variables) {
    return this.get(
      `http://${this.env.ehSystemHost}/api/hierarchy/list/${variables.customerId}`,
      variables
    );
  }
  async 'api/hierarchy/v2/list'(variables: Variables) {
    return this.get(
      `http://${this.env.ehSystemHost}/api/hierarchy/v2/list/${variables.customerId}`,
      variables
    );
  }
  async 'api/system/hierarchyTree/exportExcel'(variables: Variables) {
    return this.download(
      `http://${this.env.ehSystemHost}/api/system/hierarchyTree/exportExcel?tagExport=${variables.tagExport}`,
      variables
    );
  }
  async 'api/licensing/debuggingPhase/verifySerialNumber'(
    variables: Variables
  ) {
    return this.get(
      `http://${this.env.ehSystemHost}/api/licensing/debuggingPhase/verifySerialNumber/${variables.customerId}`,
      variables
    );
  }
  async 'api/licensing/debuggingPhase/siteDetail'(variables: Variables) {
    return this.post(
      `http://${this.env.ehSystemHost}/api/licensing/debuggingPhase/siteDetail/${variables.customerId}`,
      variables
    );
  }
  async 'api/licensing/debuggingPhase/updateDebuggingPhaseDate'(
    variables: Variables
  ) {
    return this.post(
      `http://${this.env.ehSystemHost}/api/licensing/debuggingPhase/updateDebuggingPhaseDate/${variables.customerId}?debuggingPhaseDate=${variables.debuggingPhaseDate}`,
      variables
    );
  }
  async 'api/licensing/debuggingPhase/estimate'(variables: Variables) {
    return this.post(
      `http://${this.env.ehSystemHost}/api/licensing/debuggingPhase/estimate/${variables.customerId}?siteAumCount=${variables.siteAumCount}`,
      variables
    );
  }
}

import { Auth, BaseAuthContext, PermissionCodes } from '../authorization';
import { Variables, GqlContext } from '../types';

class GeneralRestful extends BaseAuthContext {
  // @Auth(PermissionCodes[])
  'api/hierarchy/list'(root: any, variables: Variables, ctx: GqlContext) {
    return ctx.dataSources.generalDataSource['api/hierarchy/list'](variables);
  }

  // @Auth(PermissionCodes[])
  'api/hierarchy/v2/list'(root: any, variables: Variables, ctx: GqlContext) {
    return ctx.dataSources.generalDataSource['api/hierarchy/v2/list'](
      variables
    );
  }

  // @Auth(PermissionCodes[])
  'api/system/hierarchyTree/exportExcel'(
    root: any,
    variables: Variables,
    ctx: GqlContext
  ) {
    return ctx.dataSources.generalDataSource[
      'api/system/hierarchyTree/exportExcel'
    ](variables);
  }

  // @Auth(PermissionCodes[])
  'api/licensing/debuggingPhase/verifySerialNumber'(
    root: any,
    variables: Variables,
    ctx: GqlContext
  ) {
    return ctx.dataSources.generalDataSource[
      'api/licensing/debuggingPhase/verifySerialNumber'
    ](variables);
  }

  // @Auth(PermissionCodes[])
  'api/licensing/debuggingPhase/siteDetail'(
    root: any,
    variables: Variables,
    ctx: GqlContext
  ) {
    return ctx.dataSources.generalDataSource[
      'api/licensing/debuggingPhase/siteDetail'
    ](variables);
  }

  // @Auth(PermissionCodes[])
  'api/licensing/debuggingPhase/updateDebuggingPhaseDate'(
    root: any,
    variables: Variables,
    ctx: GqlContext
  ) {
    return ctx.dataSources.generalDataSource[
      'api/licensing/debuggingPhase/updateDebuggingPhaseDate'
    ](variables);
  }

  // @Auth(PermissionCodes[])
  'api/licensing/debuggingPhase/estimate'(
    root: any,
    variables: Variables,
    ctx: GqlContext
  ) {
    return ctx.dataSources.generalDataSource[
      'api/licensing/debuggingPhase/estimate'
    ](variables);
  }
}

export default GeneralRestful.init();

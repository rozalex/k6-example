import { priority, common } from './nform';
import * as moment from 'moment';

import 'moment-timezone';
import { util } from 'protobufjs';
import http from 'k6/http';


//H:\sources\avia\go_protos>pbjs -t static-module -w commonjs -o nform.js common/*.proto netitems/form/*.proto netitems/metadata/*.proto netitems/shared/*.proto
//H:\sources\avia\go_protos>pbts -o nform.d.ts nform.js

var baseUrl: string;

function escapeString(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function getTimeAndPlace(props: priority.netitems.metadata.IAdditionalProperties | null | undefined): string {
  let loc = ':' + props?.Location?.Latitude + ':' + props?.Location?.Longitude + ':' + props?.Location?.Address;

  let tz = props?.Timezone?.IANA;
  if (!tz) {
    tz = moment.tz?.guess();
    if (!tz) tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  }

  var offset = props?.Timezone?.Diff;

  if (!offset) {
    offset = -new Date().getTimezoneOffset();
    if (props?.Timezone?.IANA) offset = moment.tz(props?.Timezone?.IANA).utcOffset();
  }

  return offset + (loc ? loc : '') + (tz ? '@TZ@' + tz : '');
}

function otherInfo(props: priority.netitems.metadata.IAdditionalProperties | null | undefined): string {
  let appid = '';
  let appkey = '';
  let debugserver = '';
  if (props?.Asapi?.ID) appid = 'appid_' + props.Asapi?.ID + ',';
  if (props?.Asapi?.Key) appkey = 'appkey_' + props.Asapi?.Key + ',';
  if (props?.Debug) debugserver = 'debug,';
  return (
    '<OtherInfo xmlns="PriorityNS">app_' + props?.ApplicationName + ',' + appid + appkey + debugserver + '</OtherInfo>'
  );
}

function gmtDates() {
  let cr = new Date();
  let exp = new Date(cr);
  exp.setMinutes(cr.getMinutes() + 6);
  return '<u:Created>' + cr.toISOString() + '</u:Created><u:Expires>' + exp.toISOString() + '</u:Expires>';
}

function envelopeStart(
  props: priority.netitems.metadata.IAdditionalProperties | null | undefined,
  curop: string,
): string {
  return (
    '<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">' +
    '<s:Header><Language xmlns="PriorityNS">' +
    props?.Language +
    '</Language><Hostname xmlns="PriorityNS">' +
    /* + props.DeviceName */
    '</Hostname><WinUser xmlns="PriorityNS">' +
    '' +
    '</WinUser><UtcOffset xmlns="PriorityNS">' +
    getTimeAndPlace(props) +
    '</UtcOffset><Environment xmlns="PriorityNS">' +
    props?.Dname +
    '</Environment><SilverLight xmlns="PriorityNS">2' +
    '</SilverLight>' +
    otherInfo(props) +
    '<Security s:mustUnderstand="1" xmlns:u="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd" xmlns="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd"> <u:Timestamp u:Id="_0">' +
    gmtDates() +
    '</u:Timestamp> <UsernameToken><Username>' +
    props?.Credentials?.Simple?.Userlogin +
    '\t' +
    props?.Tabulaini +
    '</Username><Password Type="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordText">' +
    props?.Credentials?.Simple?.Password +
    '</Password></UsernameToken></Security></s:Header><s:Body><' +
    curop +
    ' xmlns="http://tempuri.org/">'
  );
}

function envelopeEnd(curop: string): string {
  return '</' + curop + '></s:Body></s:Envelope>';
}

async function sendHttpRequest(
  base64: Uint8Array,
  curop: string,
  props: common.IAdditionalProperties | null | undefined,
  signal?: AbortSignal,
): Promise<Uint8Array> {
  let str = util.base64.encode(base64, 0, base64.length);
  //let str = btoa(unescape(encodeURIComponent(new TextDecoder().decode(base64))));
  str = '<request>' + str + '</request>';
  let req = envelopeStart(props, curop) + str + envelopeEnd(curop);

    const params = {
        headers: {
            'content-type': 'text/xml; charset=utf-8',
            SOAPAction: 'http://tempuri.org/IWCFService/' + curop,
        },
    };

    
    const response = await http.post(baseUrl, req, params);


  let text = response.body;

  let splitted = text?.split(curop + 'Result>');
  if (splitted.length < 2 || splitted[1].length <= 2) text = '';
  else text = splitted[1].substring(0, splitted[1].length - 2);

  let buf64 = util.newBuffer(util.base64.length(text));
  util.base64.decode(text, buf64, 0);
  return buf64;
}

export async function start(
  req: priority.netitems.form.StartRq,
  signal?: AbortSignal,
): Promise<priority.netitems.form.StartRs> {
  let req64 = priority.netitems.form.StartRq.encode(req).finish();
  let res = await sendHttpRequest(req64, 'NFormStart', req.Properties, signal);
  return priority.netitems.form.StartRs.decode(res);
}
export async function recordZoom(
  req: priority.netitems.form.RecordZoomRq,
  signal?: AbortSignal,
): Promise<priority.netitems.form.RecordZoomRs> {
  let req64 = priority.netitems.form.RecordZoomRq.encode(req).finish();
  let res = await sendHttpRequest(req64, 'NFormRecordZoom', req.Properties, signal);
  return priority.netitems.form.RecordZoomRs.decode(res);
}
export async function htmlUnlock(
  req: priority.netitems.form.HtmlUnlockRq,
  signal?: AbortSignal,
): Promise<priority.netitems.form.HtmlUnlockRs> {
  let req64 = priority.netitems.form.HtmlUnlockRq.encode(req).finish();
  let res = await sendHttpRequest(req64, 'NFormHtmlUnlock', req.Properties, signal);
  return priority.netitems.form.HtmlUnlockRs.decode(res);
}
export async function htmlFetch(
  req: priority.netitems.form.HtmlFetchRq,
  signal?: AbortSignal,
): Promise<priority.netitems.form.HtmlFetchRs> {
  let req64 = priority.netitems.form.HtmlFetchRq.encode(req).finish();
  let res = await sendHttpRequest(req64, 'NFormHtmlFetch', req.Properties, signal);
  return priority.netitems.form.HtmlFetchRs.decode(res);
}
export async function htmlSave(
  req: priority.netitems.form.HtmlSaveRq,
  signal?: AbortSignal,
): Promise<priority.netitems.form.HtmlSaveRs> {
  let req64 = priority.netitems.form.HtmlSaveRq.encode(req).finish();
  let res = await sendHttpRequest(req64, 'NFormHtmlSave', req.Properties, signal);
  return priority.netitems.form.HtmlSaveRs.decode(res);
}
export async function htmlSignature(
  req: priority.netitems.form.HtmlSignatureRq,
  signal?: AbortSignal,
): Promise<priority.netitems.form.HtmlSignatureRs> {
  let req64 = priority.netitems.form.HtmlSignatureRq.encode(req).finish();
  let res = await sendHttpRequest(req64, 'NFormHtmlSignature', req.Properties, signal);
  return priority.netitems.form.HtmlSignatureRs.decode(res);
}
export async function recordColors(
  req: priority.netitems.form.RecordColorsRq,
  signal?: AbortSignal,
): Promise<priority.netitems.form.RecordColorsRs> {
  let req64 = priority.netitems.form.RecordColorsRq.encode(req).finish();
  let res = await sendHttpRequest(req64, 'NFormRecordColors', req.Properties, signal);
  return priority.netitems.form.RecordColorsRs.decode(res);
}

export async function olaps(
  req: priority.netitems.form.OlapsRq,
  signal?: AbortSignal,
): Promise<priority.netitems.form.OlapsRs> {
  let req64 = priority.netitems.form.OlapsRq.encode(req).finish();
  let res = await sendHttpRequest(req64, 'NFormOlaps', req.Properties, signal);
  return priority.netitems.form.OlapsRs.decode(res);
}
export async function action(
  req: priority.netitems.form.ActionRq,
  signal?: AbortSignal,
): Promise<priority.netitems.form.ActionRs> {
  let req64 = priority.netitems.form.ActionRq.encode(req).finish();
  let res = await sendHttpRequest(req64, 'NFormAction', req.Properties, signal);
  return priority.netitems.form.ActionRs.decode(res);
}
export async function actionEnd(
  req: priority.netitems.form.ActionEndRq,
  signal?: AbortSignal,
): Promise<priority.netitems.form.ActionEndRs> {
  let req64 = priority.netitems.form.ActionEndRq.encode(req).finish();
  let res = await sendHttpRequest(req64, 'NFormActionEnd', req.Properties, signal);
  return priority.netitems.form.ActionEndRs.decode(res);
}
export async function actions(
  req: priority.netitems.form.ActionsRq,
  signal?: AbortSignal,
): Promise<priority.netitems.form.ActionsRs> {
  let req64 = priority.netitems.form.ActionsRq.encode(req).finish();
  let res = await sendHttpRequest(req64, 'NFormActions', req.Properties, signal);
  return priority.netitems.form.ActionsRs.decode(res);
}
export async function statuses(
  req: priority.netitems.form.StatusesRq,
  signal?: AbortSignal,
): Promise<priority.netitems.form.StatusesRs> {
  let req64 = priority.netitems.form.StatusesRq.encode(req).finish();
  let res = await sendHttpRequest(req64, 'NFormStatuses', req.Properties, signal);
  return priority.netitems.form.StatusesRs.decode(res);
}
export async function subform(
  req: priority.netitems.form.SubformRq,
  signal?: AbortSignal,
): Promise<priority.netitems.form.StartRs> {
  let req64 = priority.netitems.form.SubformRq.encode(req).finish();
  let res = await sendHttpRequest(req64, 'NFormSubform', req.Properties, signal);
  return priority.netitems.form.StartRs.decode(res);
}
export async function subforms(
  req: priority.netitems.form.SubformsRq,
  signal?: AbortSignal,
): Promise<priority.netitems.form.SubformsRs> {
  let req64 = priority.netitems.form.SubformsRq.encode(req).finish();
  let res = await sendHttpRequest(req64, 'NFormSubforms', req.Properties, signal);
  return priority.netitems.form.SubformsRs.decode(res);
}
export async function end(
  req: priority.netitems.form.EndRq,
  signal?: AbortSignal,
): Promise<priority.netitems.form.EndRs> {
  let req64 = priority.netitems.form.EndRq.encode(req).finish();
  let res = await sendHttpRequest(req64, 'NFormEnd', req.Properties, signal);
  return priority.netitems.form.EndRs.decode(res);
}

export async function fieldUndo(
  req: priority.netitems.form.FieldUndoRq,
  signal?: AbortSignal,
): Promise<priority.netitems.form.FieldUndoRs> {
  let req64 = priority.netitems.form.FieldUndoRq.encode(req).finish();
  let res = await sendHttpRequest(req64, 'NFormFieldUndo', req.Properties, signal);
  return priority.netitems.form.FieldUndoRs.decode(res);
}

export async function recordUndo(
  req: priority.netitems.form.RecordUndoRq,
  signal?: AbortSignal,
): Promise<priority.netitems.form.RecordUndoRs> {
  let req64 = priority.netitems.form.RecordUndoRq.encode(req).finish();
  let res = await sendHttpRequest(req64, 'NFormRecordUndo', req.Properties, signal);
  return priority.netitems.form.RecordUndoRs.decode(res);
}
export async function warningApprove(
  req: priority.netitems.form.WarningApproveRq,
  signal?: AbortSignal,
): Promise<priority.netitems.form.WarningApproveRs> {
  let req64 = priority.netitems.form.WarningApproveRq.encode(req).finish();
  let res = await sendHttpRequest(req64, 'NFormWarningApprove', req.Properties, signal);
  return priority.netitems.form.WarningApproveRs.decode(res);
}
export async function recordDelete(
  req: priority.netitems.form.RecordDeleteRq,
  signal?: AbortSignal,
): Promise<priority.netitems.form.RecordDeleteRs> {
  let req64 = priority.netitems.form.RecordDeleteRq.encode(req).finish();
  let res = await sendHttpRequest(req64, 'NFormRecordDelete', req.Properties, signal);
  return priority.netitems.form.RecordDeleteRs.decode(res);
}
export async function recordSave(
  req: priority.netitems.form.RecordSaveRq,
  signal?: AbortSignal,
): Promise<priority.netitems.form.RecordSaveRs> {
  let req64 = priority.netitems.form.RecordSaveRq.encode(req).finish();
  let res = await sendHttpRequest(req64, 'NFormRecordSave', req.Properties, signal);
  return priority.netitems.form.RecordSaveRs.decode(res);
}
export async function fieldUpdate(
  req: priority.netitems.form.FieldUpdateRq,
  signal?: AbortSignal,
): Promise<priority.netitems.form.FieldUpdateRs> {
  let req64 = priority.netitems.form.FieldUpdateRq.encode(req).finish();
  let res = await sendHttpRequest(req64, 'NFormFieldUpdate', req.Properties, signal);
  return priority.netitems.form.FieldUpdateRs.decode(res);
}
export async function fieldSelect(
  req: priority.netitems.form.FieldSelectRq,
  signal?: AbortSignal,
): Promise<priority.netitems.form.FieldSelectRs> {
  let req64 = priority.netitems.form.FieldSelectRq.encode(req).finish();
  let res = await sendHttpRequest(req64, 'NFormFieldSelect', req.Properties, signal);
  return priority.netitems.form.FieldSelectRs.decode(res);
}
export async function recordEdit(
  req: priority.netitems.form.RecordEditRq,
  signal?: AbortSignal,
): Promise<priority.netitems.form.RecordEditRs> {
  let req64 = priority.netitems.form.RecordEditRq.encode(req).finish();
  let res = await sendHttpRequest(req64, 'NFormRecordEdit', req.Properties, signal);
  return priority.netitems.form.RecordEditRs.decode(res);
}

export async function help(
  req: priority.netitems.form.HelpRq,
  signal?: AbortSignal,
): Promise<priority.netitems.form.HelpRs> {
  let req64 = priority.netitems.form.HelpRq.encode(req).finish();
  let res = await sendHttpRequest(req64, 'NFormHelp', req.Properties, signal);
  return priority.netitems.form.HelpRs.decode(res);
}

export async function recordsFetch(
  req: priority.netitems.form.FetchRq,
  signal?: AbortSignal,
): Promise<priority.netitems.form.FetchRs> {
  let req64 = priority.netitems.form.FetchRq.encode(req).finish();
  let res = await sendHttpRequest(req64, 'NFormFetch', req.Properties, signal);
  return priority.netitems.form.FetchRs.decode(res);
}

export async function columns(
  req: priority.netitems.form.ColumnsRq,
  signal?: AbortSignal,
): Promise<priority.netitems.form.ColumnsRs> {
  let req64 = priority.netitems.form.ColumnsRq.encode(req).finish();
  let res = await sendHttpRequest(req64, 'NFormColumns', req.Properties, signal);
  return priority.netitems.form.ColumnsRs.decode(res);
}

export async function batch(
  req: priority.netitems.form.BatchRq,
  properties: common.IAdditionalProperties,
  signal?: AbortSignal,
): Promise<priority.netitems.form.BatchRs> {
  let req64 = priority.netitems.form.BatchRq.encode(req).finish();
  let res = await sendHttpRequest(req64, 'NFormBatch', properties, signal);
  return priority.netitems.form.BatchRs.decode(res);
}

export function setBaseUrl(url: string) {
  baseUrl = url;
}

export async function dataStoreSet(
  req: priority.netitems.ngtw.DataStoreSetRq,
  signal?: AbortSignal,
): Promise<priority.netitems.ngtw.DataStoreSetRs> {
  let req64 = priority.netitems.ngtw.DataStoreSetRq.encode(req).finish();
  let res = await sendHttpRequest(req64, 'NGtwDataStoreSet', req.Properties, signal);
  return priority.netitems.ngtw.DataStoreSetRs.decode(res);
}

export async function dataStoreGet(
  req: priority.netitems.ngtw.DataStoreGetRq,
  signal?: AbortSignal,
): Promise<priority.netitems.ngtw.DataStoreGetRs> {
  let req64 = priority.netitems.ngtw.DataStoreGetRq.encode(req).finish();
  let res = await sendHttpRequest(req64, 'NGtwDataStoreGet', req.Properties, signal);
  return priority.netitems.ngtw.DataStoreGetRs.decode(res);
}

export async function formSystemConstants(
  req: priority.netitems.form.SystemConstantsRq,
  signal?: AbortSignal,
): Promise<priority.netitems.form.SystemConstantsRs> {
  let req64 = priority.netitems.form.SystemConstantsRq.encode(req).finish();
  let res = await sendHttpRequest(req64, 'NFormSystemConstants', req.Properties, signal);
  return priority.netitems.form.SystemConstantsRs.decode(res);
}

export async function whoAmI(
  req: priority.netitems.ngen.WhoAmIRq,
  signal?: AbortSignal,
): Promise<priority.netitems.ngen.WhoAmIRs> {
  let req64 = priority.netitems.ngen.WhoAmIRq.encode(req).finish();
  let res = await sendHttpRequest(req64, 'NGenWhoAmI', req.Properties, signal);
  return priority.netitems.ngen.WhoAmIRs.decode(res);
}

export async function CheckModule(
  req: priority.netitems.ngen.CheckModuleRq,
  signal?: AbortSignal,
): Promise<priority.netitems.ngen.CheckModuleRs> {
  let req64 = priority.netitems.ngen.CheckModuleRq.encode(req).finish();
  let res = await sendHttpRequest(req64, 'NGenCheckModule', req.Properties, signal);
  return priority.netitems.ngen.CheckModuleRs.decode(res);
}

export async function CheckModules(
  req: priority.netitems.ngen.CheckModulesRq,
  signal?: AbortSignal,
): Promise<priority.netitems.ngen.CheckModulesRs> {
  let req64 = priority.netitems.ngen.CheckModulesRq.encode(req).finish();
  let res = await sendHttpRequest(req64, 'NGenCheckModules', req.Properties, signal);
  return priority.netitems.ngen.CheckModulesRs.decode(res);
}

export async function Links(
  req: priority.netitems.ngen.LinkRq,
  signal?: AbortSignal,
): Promise<priority.netitems.ngen.LinkRs> {
  let req64 = priority.netitems.ngen.LinkRq.encode(req).finish();
  let res = await sendHttpRequest(req64, 'NGenLinks', req.Properties, signal);
  return priority.netitems.ngen.LinkRs.decode(res);
}

export async function CountFetch(
  req: priority.netitems.form.CountFetchRq,
  signal?: AbortSignal,
): Promise<priority.netitems.form.CountFetchRs> {
  let req64 = priority.netitems.form.CountFetchRq.encode(req).finish();
  let res = await sendHttpRequest(req64, 'NFormCountFetch', req.Properties, signal);
  return priority.netitems.form.CountFetchRs.decode(res);
}

export async function AlertList(
  req: priority.netitems.form.AlertListRq,
  signal?: AbortSignal,
): Promise<priority.netitems.form.AlertListRs> {
  const req64 = priority.netitems.form.AlertListRq.encode(req).finish();
  const res = await sendHttpRequest(req64, 'NFormAlertList', req.Properties, signal);

  return priority.netitems.form.AlertListRs.decode(res);
}

export async function AlertChooses(
  req: priority.netitems.form.AlertChoosesRq,
  signal?: AbortSignal,
): Promise<priority.netitems.form.AlertChoosesRs> {
  const req64 = priority.netitems.form.AlertChoosesRq.encode(req).finish();
  const res = await sendHttpRequest(req64, 'NFormAlertChooses', req.Properties, signal);

  return priority.netitems.form.AlertChoosesRs.decode(res);
}

export async function TableViewColumnsDesign(
  req: priority.netitems.form.TableViewColumnsDesignRq,
  signal?: AbortSignal,
): Promise<priority.netitems.form.TableViewColumnsDesignRs> {
  const req64 = priority.netitems.form.TableViewColumnsDesignRq.encode(req).finish();
  const res = await sendHttpRequest(req64, 'NFormTableViewColumnsDesign', req.Properties, signal);

  return priority.netitems.form.TableViewColumnsDesignRs.decode(res);
}

export async function AlertSave(
  req: priority.netitems.form.AlertSaveRq,
  signal?: AbortSignal,
): Promise<priority.netitems.form.AlertListRs> {
  const req64 = priority.netitems.form.AlertSaveRq.encode(req).finish();
  const res = await sendHttpRequest(req64, 'NFormAlertSave', req.Properties, signal);

  return priority.netitems.form.AlertListRs.decode(res);
}

export async function AlertDelete(
  req: priority.netitems.form.AlertDeleteRq,
  signal?: AbortSignal,
): Promise<priority.netitems.form.EmptyRs> {
  const req64 = priority.netitems.form.AlertDeleteRq.encode(req).finish();
  const res = await sendHttpRequest(req64, 'NFormAlertDelete', req.Properties, signal);

  return priority.netitems.form.EmptyRs.decode(res);
}

export async function AlertChoose(
  req: priority.netitems.form.AlertChooseRq,
  signal?: AbortSignal,
): Promise<priority.netitems.form.FieldSelectRs> {
  const req64 = priority.netitems.form.AlertChooseRq.encode(req).finish();
  const res = await sendHttpRequest(req64, 'NFormAlertChoose', req.Properties, signal);

  return priority.netitems.form.FieldSelectRs.decode(res);
}

export async function RowViewColumnsDesign(
  req: priority.netitems.form.RowViewColumnsDesignRq,
  signal?: AbortSignal,
): Promise<priority.netitems.form.RowViewColumnsDesignRs> {
  const req64 = priority.netitems.form.RowViewColumnsDesignRq.encode(req).finish();
  const res = await sendHttpRequest(req64, 'NFormRowViewColumnsDesign', req.Properties, signal);

  return priority.netitems.form.RowViewColumnsDesignRs.decode(res);
}

export async function SaveRowViewColumnsDesign(
  req: priority.netitems.form.SaveRowViewColumnsDesignRq,
  signal?: AbortSignal,
): Promise<priority.netitems.form.SaveRowViewColumnsDesignRs> {
  const req64 = priority.netitems.form.SaveRowViewColumnsDesignRq.encode(req).finish();
  const res = await sendHttpRequest(req64, 'NFormSaveRowViewColumnsDesign', req.Properties, signal);

  return priority.netitems.form.SaveRowViewColumnsDesignRs.decode(res);
}

export async function AlertOrder(
  req: priority.netitems.form.AlertOrderRq,
  signal?: AbortSignal,
): Promise<priority.netitems.form.EmptyRs> {
  const req64 = priority.netitems.form.AlertOrderRq.encode(req).finish();
  const res = await sendHttpRequest(req64, 'NFormAlertOrder', req.Properties, signal);

  return priority.netitems.form.EmptyRs.decode(res);
}

export async function ReportCancel(
  req: priority.netitems.nrest.ReportCancelRq,
  signal?: AbortSignal,
): Promise<priority.netitems.nrest.ReportCancelRs> {
  const req64 = priority.netitems.nrest.ReportCancelRq.encode(req).finish();
  const res = await sendHttpRequest(req64, 'NFormReportCancel', req.Properties, signal);

  return priority.netitems.nrest.ReportCancelRs.decode(res);
}

export async function AlertCheckExpr(
  req: priority.netitems.form.AlertCheckExprRq,
  signal?: AbortSignal,
): Promise<priority.netitems.form.AlertCheckExprRs> {
  const req64 = priority.netitems.form.AlertCheckExprRq.encode(req).finish();
  const res = await sendHttpRequest(req64, 'NFormAlertCheckExpr', req.Properties, signal);

  return priority.netitems.form.AlertCheckExprRs.decode(res);
}
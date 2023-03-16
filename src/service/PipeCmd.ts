import { createCmd } from "@bk/socket-stream-client";

export const heartPipeCmd = createCmd('/ping');

export const getServerAddrCmd = createCmd('/client/getServerAddr');

export const setServerAddrCmd = createCmd('/client/setServerAddr');

export const getLogFileAddrCmd = createCmd('/client/getLogFileAddr');

export const queryComponentCmd = createCmd('/client/getCurrentPluginMap');

export const queryComUpdateCmd = createCmd('/client/getUpdatingPluginInfoMap');

export const queryOrderComUpdateCmd = createCmd('/client/getUpdatingPluginInfoByInsideName');

export const updateOrderComCmd = createCmd('/client/updateByName');

export const updateAllComCmd = createCmd('/client/updateAll');

export const queryProgarmUpdateCmd = createCmd('/client/checkClientUpdate');

export const serverUpdateParamCmd = createCmd('/client/updateClientServer');

export const updateViewCmd = createCmd('/client/updateClientWeb');

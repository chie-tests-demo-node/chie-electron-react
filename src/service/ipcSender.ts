import { BrowserWindow } from 'electron'
import { sentCmd } from './ipcCmd';
import { ServerStatus } from './localServer'

/**
 * 消息要发送到哪里
 */
let MSGTARGET: BrowserWindow | undefined = undefined;

/**
 * 页面是否加载完毕
 */
let VIEWLOADED: boolean = false;

/**
 * 注册消息发送对象
 * @param target 
 * @returns 
 */
export const registMsgTarget = (target: BrowserWindow) => MSGTARGET = target;

/**
 * 设置页面是否加载完毕
 * @param loaded 
 * @returns 
 */
export const setViewIsLoaded = (loaded: boolean) => {
    VIEWLOADED = loaded;
    if (lastSvcStatusObj) {
        const status = lastSvcStatusObj.status;
        const msg = lastSvcStatusObj.errorMsg;
        lastSvcStatusObj = undefined;
        sendSvcStatus(status, msg);
    }
}


type SvcStatusObj = {
    status: ServerStatus;
    errorMsg?: string;
}

/**
 * 在页面没有挂载完毕的时候，最后一次向页面通知的服务状态参数
 */
let lastSvcStatusObj: SvcStatusObj | undefined = undefined;

/**
 * 向渲染进程发送服务状态
 * @param status 
 * @param errorMsg 
 */
export const sendSvcStatus = (status: ServerStatus, errorMsg?: string) => {
    if (!VIEWLOADED) {
        lastSvcStatusObj = { status, errorMsg };
        return;
    }
    lastSvcStatusObj = undefined;
    MSGTARGET?.webContents.send(sentCmd.svcStatus, { status, errorMsg });
}
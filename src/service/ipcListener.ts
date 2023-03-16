import { ipcMain } from "electron";
import { listenCmd } from "./ipcCmd";
import { setViewIsLoaded } from "./ipcSender";
import { serverAwaken, serverPlaydead, serverStart } from "./localServer";


const initIpcListen = () => {
    //启动服务
    ipcMain.on(listenCmd.svcStart, () => serverStart());

    //服务假死
    ipcMain.on(listenCmd.svcPlaydead, () => serverPlaydead());

    //唤起服务
    ipcMain.on(listenCmd.svcAwaken, () => serverAwaken());

    //渲染进程加载状态
    ipcMain.on(listenCmd.viewCompleted, (_, isLoaded: boolean) => setViewIsLoaded(isLoaded));
}

export default initIpcListen;
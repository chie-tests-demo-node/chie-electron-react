import { ipcMain } from "electron";
import { invokeCmd } from "./ipcCmd";
import { getLocalSvcName, getProgramPath, queryServerStatus, queryServerVersion, queryViewVersion, serverAwaken, serverPlaydead, serverRestart, } from "./localServer";
import { isDev, isNull } from "../utils";
import { getLogFileAddr, getServerAddr, getServerUpdateParam, queryComponent, queryComUpdate, queryOrderComUpdate, queryProgarmUpdate, setServerAddr, updateAllCom, updateMainView, updateOrderCom } from "./PipeServer";
import { setStoreSvcHash, setStoreSvcVer } from "./store";
import fs from 'fs';
import path from 'path';
import logger from "./log4js";



const CURRENTLOGPREFIX = "ipcHandler";
const initIpcHander = () => {
    //服务状态查询
    ipcMain.handle(invokeCmd.svcStatusQuery, () => queryServerStatus());

    //页面版本查询
    ipcMain.handle(invokeCmd.versionViewQuery, () => queryViewVersion());

    //服务版本查询
    ipcMain.handle(invokeCmd.versionSvcQuery, () => queryServerVersion());

    //版本说明查询
    ipcMain.handle(invokeCmd.versionMarkdown, () => {
        const readmePath = path.join(__dirname, "..", "..", "README.md");
        return fs.readFileSync(readmePath, { encoding: 'utf-8' });
    });

    //获取签名服务器地址
    ipcMain.handle(invokeCmd.queryClientAddr, async () => await getServerAddr());

    //设置签名服务器地址
    ipcMain.handle(invokeCmd.setClientAddr, async (_, payload) => await setServerAddr(payload));

    //查询日志地址
    ipcMain.handle(invokeCmd.querySvcLogAddr, async (_, payload) => await getLogFileAddr(payload));

    //查询本地服务地址
    ipcMain.handle(invokeCmd.queryLocalLogAddr, () => {
        let logPath: string;
        if (isDev()) {
            logPath = path.join(__dirname, "..", "..", "logs");
        } else {
            logPath = path.join(__dirname, "..", "..", "..", "..", "logs");
        }
        const logs = fs.readdirSync(logPath, { encoding: 'utf-8' });
        return { basePath: logPath, logs };
    });

    //查询所有组件
    ipcMain.handle(invokeCmd.queryComponents, async () => await queryComponent());

    //查询所有组件更新
    ipcMain.handle(invokeCmd.queryComponentUpdate, async () => await queryComUpdate());

    //查询指定组件更新
    ipcMain.handle(invokeCmd.queryOrderComUpdate, async (_, insideName: string) => await queryOrderComUpdate(insideName));

    //更新指定组件
    ipcMain.handle(invokeCmd.updateOrderComponent, async (_, insideName: string) => await updateOrderCom(insideName));

    //更新所有组件
    ipcMain.handle(invokeCmd.updateAllComponent, async () => await updateAllCom());

    //查询主程序更新
    ipcMain.handle(invokeCmd.programUpdateQuery, async () => {
        if (queryServerStatus() !== 'runing') {
            return Promise.reject('请先启动服务');
        }
        return await queryProgarmUpdate();
    });


    interface ISvcUpdateParams {
        pId: number;
        newSvcPath: string;
        newSvcFolder: string;
        newSvcHash: string;
    }

    //更新本地服务
    ipcMain.handle(invokeCmd.updateLocalServer, async (_, { svcId, svcVersion }) => {
        try {
            const updateParam = await getServerUpdateParam(svcId);

            if (isNull(updateParam) || updateParam.code === -1 || isNull(updateParam.data)) {
                return Promise.reject(updateParam?.msg);
            }

            console.info(updateParam.data);

            const { newSvcPath, newSvcFolder, newSvcHash } = updateParam.data;

            //结束现有服务
            // process.kill(pId);
            await serverPlaydead();

            //1.验证新服务地址并修改文件名
            if (!fs.existsSync(newSvcPath)) {
                return Promise.reject('更新失败，服务地址错误');
            }
            const reallyNewSvcPath = path.join(newSvcFolder, getLocalSvcName());
            fs.renameSync(newSvcPath, reallyNewSvcPath);

            //3.将新服务剪切过去
            fs.copyFileSync(reallyNewSvcPath, getProgramPath());
            fs.unlinkSync(reallyNewSvcPath);

            //4.赋值新的版本号和hash
            setStoreSvcVer(svcVersion);
            setStoreSvcHash(newSvcHash);

            //5.服务启动
            serverAwaken();

        } catch (error) {
            logger.error(CURRENTLOGPREFIX, JSON.stringify(error));
            return Promise.reject(error);
        }
    });

    //更新客户端页面
    ipcMain.handle(invokeCmd.updateMainView, async (_, updateId: string) => await updateMainView(updateId));
}

export default initIpcHander;
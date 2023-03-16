import { Socket } from 'net';
import { createStream, Stream } from '@bk/socket-stream-client'
import { getProgramFolder, getProgramName, queryViewVersion, serverRestart, updateServerStatus } from './localServer';
import { getLogFileAddrCmd, getServerAddrCmd, heartPipeCmd, queryComponentCmd, queryComUpdateCmd, queryOrderComUpdateCmd, queryProgarmUpdateCmd, serverUpdateParamCmd, setServerAddrCmd, updateAllComCmd, updateOrderComCmd, updateViewCmd } from './PipeCmd';
import logger from './log4js';
import path from 'path';
const AsyncLock = require('async-lock');


const CURRENTLOGPREFIX = "pipeServer";

//统一连接流
let CONNECTSTREAM: Stream | undefined = undefined;

//注册连接流
export const registConnStream = (socket: Socket) => {
    CONNECTSTREAM = createStream(socket, { timeout: -1 });
}

//获取连接流
export const getConnStream = () => CONNECTSTREAM;

let isFailed = false;

//pipe管道请求壳
export const basePipeRequest = async (request: () => Promise<any>, onError?: (error: any) => void): Promise<any> => {
    if (!CONNECTSTREAM) {
        logger.error(CURRENTLOGPREFIX, '当前请求流为空，请检查是否注册了请求流');
        return Promise.reject('请求流未注册');
    }
    try {
        var rsp = await request();
        if (rsp) {
            const rspStr = rsp?.rawData().toString();
            try {
                var rspObj = JSON.parse(rspStr);
                return Promise.resolve(rspObj);
            } catch (error) {
                return Promise.resolve(rspStr);
            }
        }
        isFailed = false;
        return Promise.resolve(rsp);
    } catch (error) {
        new AsyncLock().acquire('onPipleError', (done: any) => {
            if (!isFailed) {
                //防止重复调用
                isFailed = true;

                //第一件事儿还是杀了心跳服务
                keepHeartRemove();

                onError?.(error);
                updateServerStatus('stoped', '检测到服务连接异常，已经自动为您执行了重启命令');

                //唤醒本地服务
                serverRestart();
            }
            done();
        });
        return Promise.reject(error);
    }
}


let KEEPHEARTJOB: any;

//检测服务心跳 change:20220902 领导建议改为10秒一次
export const keepHeart = () => {
    KEEPHEARTJOB = setTimeout(async () => {
        try {
            await basePipeRequest(async () => {
                await heartPipeCmd.exchange(CONNECTSTREAM!);
                return Promise.resolve()
            });
            // logger.info(CURRENTLOGPREFIX, '定时心跳检测完成');
            keepHeart();
        } catch (error) {
            logger.error(CURRENTLOGPREFIX, `服务心跳检测异常，程序断开，开始重启，心跳异常捕获错误：\r\n${JSON.stringify(error)}`);
        }
    }, 10000);
}

//移除检测服务心跳任务
export const keepHeartRemove = () => clearTimeout(KEEPHEARTJOB);


//获取签名服务器地址
export const getServerAddr = async () => await basePipeRequest(async () => {
    var rsp = await getServerAddrCmd.exchange(CONNECTSTREAM!);
    return Promise.resolve(rsp);
});

//设置签名服务器地址
export const setServerAddr = async (payload: any) => await basePipeRequest(async () => {
    var rsp = await setServerAddrCmd.exchangeWithJsonData(payload, CONNECTSTREAM!);
    return Promise.resolve(rsp);
});

//查询日志文件地址
export const getLogFileAddr = async (payload: any) => await basePipeRequest(async () => {
    var rsp = await getLogFileAddrCmd.exchangeWithJsonData(payload, CONNECTSTREAM!);
    return Promise.resolve(rsp);
});

//查询当前安装的所有组件
export const queryComponent = async () => await basePipeRequest(async () => {
    var rsp = await queryComponentCmd.exchange(CONNECTSTREAM!);
    return Promise.resolve(rsp);
});

//查询当前安装组件更新列表
export const queryComUpdate = async () => await basePipeRequest(async () => {
    var rsp = await queryComUpdateCmd.exchange(CONNECTSTREAM!);
    return rsp;
});

//查询指定组件的更新
export const queryOrderComUpdate = async (insideName: string) => await basePipeRequest(async () => {
    var rsp = await queryOrderComUpdateCmd.exchangeWithJsonData({ insideName }, CONNECTSTREAM!);
    return rsp;
});

//更新指定组件
export const updateOrderCom = async (insideName: string) => await basePipeRequest(async () => {
    var rsp = await updateOrderComCmd.exchangeWithJsonData({ insideName }, CONNECTSTREAM!);
    return rsp;
});

//更新所有组件
export const updateAllCom = async () => await basePipeRequest(async () => {
    var rsp = await updateAllComCmd.exchange(CONNECTSTREAM!);
    return rsp;
});

//查询程序更新
export const queryProgarmUpdate = async () => await basePipeRequest(async () => {
    var rsp = await queryProgarmUpdateCmd.exchangeWithJsonData({ clientWebVersion: queryViewVersion() }, CONNECTSTREAM!);
    return rsp;
});

//获取服务更新参数
export const getServerUpdateParam = async (updateId: string) => await basePipeRequest(async () => {
    var rsp = await serverUpdateParamCmd.exchangeWithJsonData({ clientServerUpdateId: updateId }, CONNECTSTREAM!);
    return rsp;
});

//发起页面更新请求
export const updateMainView = async (updateId: string) => await basePipeRequest(async () => {
    await updateViewCmd.exchangeWithJsonData({
        pid: process.pid,
        orderPath: getProgramFolder(),
        startPath: path.join(getProgramFolder(), '..', getProgramName()),
        clientWebUpdateId: updateId
    }, CONNECTSTREAM!);
});
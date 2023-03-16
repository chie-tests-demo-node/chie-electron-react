
import { clearStore, getStoreSvcHash, getStoreSvcVer } from './store';
import { IPackageConfig } from '../types'
import { isDev, isNull } from '../utils';
import { sendSvcStatus } from './ipcSender';
import { getConnStream, keepHeart, keepHeartRemove, registConnStream } from './PipeServer';
import os from 'os';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import net from 'net';
import logger from './log4js';
import exec from 'child_process';
const packageConfig: IPackageConfig = require('../../package.json');
const AsyncLock = require('async-lock');


export type ServerStatus = 'stoped' | 'starting' | 'runing' | 'stopping' | 'error' | 'playdead';
interface IPipeRsp {
    path: string;
    pid: number;
    clientVersion: string;
}


var CURRENTSERVERSTATUS: ServerStatus = 'stoped';
const CURRENTLOGPREFIX = 'localServer';
const PIPENAME = "\\\\.\\pipe\\dzqz_pipe";
const SERVERRUNTIME = 3000; //服务启动成功之后，多少秒后检查连接状态
const MAXCHECKALIVENUM = 3; //最大检测连接次数 3次（杀启流程3次还是失败，抛出异常）


//对外提供的服务状态查询
export const queryServerStatus = () => CURRENTSERVERSTATUS;

//获取本地服务版本
export const queryServerVersion = () => {
    const storeSvcVersion = getStoreSvcVer();
    if (!isNull(storeSvcVersion)) {
        return storeSvcVersion
    } else {
        return packageConfig.program.svcVersion;
    }
};

//获取页面程序版本
export const queryViewVersion = () => {
    return packageConfig.program.viewVersion;
}

const queryServerHash = () => {
    const stroeSvcHash = getStoreSvcHash();
    if (!isNull(stroeSvcHash)) {
        return stroeSvcHash;
    } else {
        return packageConfig.program.svchash;
    }
}


//更新服务状态统一入口
export const updateServerStatus = (status: ServerStatus, msg?: string) => {
    CURRENTSERVERSTATUS = status;
    //ipcMain 通知渲染进程
    sendSvcStatus(status, msg);
}


//服务启动入口
export const serverStart = async () => {
    // //clearStore();
    // //错误状态直接退出，避免死循环
    // if (CURRENTSERVERSTATUS === 'error') {
    //     logger.info(CURRENTLOGPREFIX, '检测到当前启动状态为错误，直接退出');
    //     return;
    // }

    // //设置启动中状态
    // updateServerStatus('starting');

    // //检查连接：
    // let isAlive: boolean = false;
    // try {
    //     logger.info(CURRENTLOGPREFIX, "开始检查服务状态");
    //     isAlive = await serverIsAlive();
    //     logger.info(CURRENTLOGPREFIX, `服务状态：${isAlive}`);
    // } catch (error: any) {
    //     logger.error(CURRENTLOGPREFIX, '检查服务连接状态异常，直接退出');
    //     updateServerStatus('error', error.toString());
    //     return;
    // }

    // if (!isAlive) {
    //     await serverRestart();
    //     return;
    // }

    //设置服务启动
    updateServerStatus('runing');
}


//重启服务
export const serverRestart = async () => {
    updateServerStatus('starting');
    await serverStop();
    var initOk = await serverInit();
    if (initOk) {
        setTimeout(() => {
            serverStart();
        }, SERVERRUNTIME);
    } else {
        updateServerStatus('error', '服务在安装或启动时发生异常，详见客户端日志');
    }
}


let CHECKRETRYCOUNT = 0;


//检查程序是否活着
const serverIsAlive = async (): Promise<boolean> => {
    return new Promise(async (resolve, reject) => {
        //重试次数
        if (CHECKRETRYCOUNT >= MAXCHECKALIVENUM) {
            const errorMsg = `服务启动失败重启次数已达最大限制，详见日志`;
            logger.error(CURRENTLOGPREFIX, errorMsg);
            return reject(errorMsg);
        }

        //平台检测
        const plat = os.platform();
        if (plat !== 'win32') {
            const errorMsg = `${plat}不是受支持的平台`;
            logger.error(CURRENTLOGPREFIX, errorMsg);
            return reject(errorMsg);
        }

        //连接成功标识
        let connIsOk: boolean = false;
        let isDealy: boolean = false;
        //连接限制器: 三秒未连接，直接返回
        const dealyJob = setTimeout(() => {
            if (!connIsOk) {
                isDealy = true;
                conn.destroy();
                logger.error(CURRENTLOGPREFIX, '管道连接超时');
                CHECKRETRYCOUNT++;
                resolve(false);
            }
        }, 3000);

        //连接管道
        const conn = net.createConnection(PIPENAME);

        //注册连接流
        registConnStream(conn);

        //接收管道消息
        const rspSvcPathRsp = await getConnStream()!.receiveMsg();
        if (isDealy) {
            return;
        }
        if (rspSvcPathRsp.err) {
            logger.error(CURRENTLOGPREFIX, '读取程序路径异常' + rspSvcPathRsp.err.message);
            CHECKRETRYCOUNT++;
            return resolve(false);
        }
        connIsOk = true;
        clearTimeout(dealyJob);
        logger.info(CURRENTLOGPREFIX, '管道连接成功');

        if (!rspSvcPathRsp?.data) {
            //如果接收的空，拜拜
            conn.destroy();
            logger.error(CURRENTLOGPREFIX, '没有收到管道消息');
            CHECKRETRYCOUNT++;
            return resolve(false);
        }

        logger.info(CURRENTLOGPREFIX, `成功收到管道消息：${rspSvcPathRsp.data}`)

        // //序列化响应结果
        // let pipeRsp: IPipeRsp;
        // try {
        //     pipeRsp = JSON.parse(rspSvcPathRsp.data.toString());
        // } catch (error) {
        //     logger.error(CURRENTLOGPREFIX, '管道连接时接收消息解析失败');
        //     CHECKRETRYCOUNT++;
        //     return resolve(false);
        // }

        // //启动路径核验
        // const rspSvcPath = path.join(pipeRsp.path, packageConfig.program.svcName.win);
        // const configPath = getProgramPath();
        // if (rspSvcPath !== configPath) {
        //     logger.error(CURRENTLOGPREFIX, `管道返回程序路径与配置中程序路径不符\r\n管道返回路径：${rspSvcPath}\r\n应为路径：${configPath}`);
        //     // process.kill(pipeRsp.pid);
        //     CHECKRETRYCOUNT++;
        //     return resolve(false);
        // }

        // //路径存在核验
        // if (!fs.existsSync(configPath)) {
        //     logger.error(CURRENTLOGPREFIX, '程序路径不存在');
        //     // process.kill(pipeRsp.pid);
        //     CHECKRETRYCOUNT++;
        //     return resolve(false);
        // }

        // //版本核验
        // if (queryServerVersion() != pipeRsp.clientVersion) {
        //     logger.error(CURRENTLOGPREFIX, `本地服务版本异常，管道返回版本：${pipeRsp.clientVersion}，应为版本：${queryServerVersion()}`);
        //     // process.kill(pipeRsp.pid);
        //     // logger.error(CURRENTLOGPREFIX, "位置1");
        //     CHECKRETRYCOUNT++;
        //     return resolve(false);
        // }

        // //hash核验
        // const hash = crypto.createHash('sha256').update(fs.readFileSync(configPath)).digest('hex');
        // if (hash !== queryServerHash()) {
        //     logger.error(CURRENTLOGPREFIX, `程序的hash值与配置中的hash不符，计算的hash为：${hash}，配置的hash为：${queryServerHash()}`);
        //     // process.kill(pipeRsp.pid);
        //     CHECKRETRYCOUNT++;
        //     return resolve(false);
        // }

        //持续跟进连接状态
        keepHeart();

        //返回连接成功
        resolve(true);
    });
}


//获取exe执行程序路径
export const getProgramPath = () => {
    // if (isDev()) {
    //     return path.join(__dirname, "..", "..", "service", "win", packageConfig.program.exeName.win);
    // }
    // return path.join(__dirname, "..", "..", "..", packageConfig.program.exeName.win);
    return path.join(getProgramFolder(), getLocalSvcName());
}

//获取exe执行程序目标目录
export const getProgramFolder = () => {
    if (isDev()) {
        return path.join(__dirname, "..", "..", "service", "win");
    }
    return path.join(__dirname, "..", "..", "..");
}

//获取本地服务exe执行程序名称
export const getLocalSvcName = () => packageConfig.program.svcName.win;

//获取客户端exe程序名称
export const getProgramName = () => packageConfig.program.exeName.win;


//执行shell命令
const spawnShell = async (cmd: string, args: any[]): Promise<boolean> => {
    return new Promise((resolve) => {
        const task = exec.spawn(cmd, args, { env: { CAROOT: '' } });
        task.addListener('close', (code) => {
            if (code !== 0) {
                logger.error(CURRENTLOGPREFIX, `shell命令: ${cmd}执行失败，返回代码：${code}`);
                resolve(false);
                return
            }
            resolve(true);
        });
        task.stdout.addListener('data', (data) => {
            logger.info(CURRENTLOGPREFIX, `shell命令：${cmd} stdout返回内容：\r\n${data.toString()}`);
        });
        task.stderr.addListener('data', (data) => {
            logger.info(CURRENTLOGPREFIX, `shell命令：${cmd} stderr返回内容：\r\n${data.toString()}`);
        });
    });
}

//抽取服务安装方法
const execServerInstall = async (): Promise<boolean> => {
    const programPath = getProgramPath();
    const programDir = path.dirname(getProgramPath());
    const createRsp = await spawnShell(programPath, ['-cmd=install', `-rootPath=${programDir}`]);
    return Promise.resolve(createRsp);
}

//抽取服务启动方法
const execServerStart = async (): Promise<boolean> => {
    const programPath = getProgramPath();
    const programDir = path.dirname(getProgramPath());
    const startRsp = await spawnShell(programPath, ['-cmd=start', `-rootPath=${programDir}`]);
    return Promise.resolve(startRsp);
}

//抽取服务停止方法
const execServerStop = async () => {
    /**
     * 这是我们的停止
     */
    const programPath = getProgramPath();
    await spawnShell(programPath, ['-cmd=stop']);

    // console.info("1111");

    /**
     * 这是不留活口 10次尝试结束对28006的占用
     */
    kill28006();

    // console.info("2222");
}

//抽取服务卸载方法
const execServerUninstall = async () => {
    const programPath = getProgramPath();
    await spawnShell(programPath, ['-cmd=uninstall']);
}


//服务初始化
const serverInit = async (): Promise<boolean> => {
    //设置启动中状态
    updateServerStatus('starting');

    //创建本地服务
    const installRsp = await execServerInstall();
    if (!installRsp) {
        return Promise.resolve(false);
    }

    //启动本地服务
    const startRsp = await execServerStart();
    return Promise.resolve(startRsp);
}


//停止和删除本地服务
export const serverStop = async () => {
    //设置停止中状态
    if (CURRENTSERVERSTATUS === 'runing') {
        updateServerStatus('stopping');
    }

    //停止本地服务
    await execServerStop();

    //卸载本地服务
    await execServerUninstall();

    //设置停止状态
    if (CURRENTSERVERSTATUS !== 'error') {
        updateServerStatus('stoped');
    }
}


let dangerOptLock = false;

const lockDangerOpt = (): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
        new AsyncLock({ timeout: 100 }).acquire('dangerOptLock', (done: any) => {
            if (dangerOptLock) {
                resolve(false);
            } else {
                dangerOptLock = true;
                resolve(true);
            }
            done();
        }, () => {
            resolve(false);
        })
    });
}

const unLockDangerOpt = () => dangerOptLock = false;

//执行危险操作壳
const dangerOptContainer = async (dangerFnc: any) => {
    if (await lockDangerOpt()) {
        await dangerFnc();
        unLockDangerOpt();
    }
}


//仅停止服务，不卸载服务
export const serverPlaydead = async () => {
    //首先杀了心跳任务
    keepHeartRemove();

    //在防止并发框架中执行以下操作
    await dangerOptContainer(async () => {
        //设置停止中
        updateServerStatus('stopping');

        //停止本地服务
        await execServerStop();

        //设置假死状态
        updateServerStatus('playdead');
    });
}

//2022/09/26 这个方法是没有前途的
//唤起服务
export const serverAwaken = async () => {
    //在防止并发框架中执行如下操作
    await dangerOptContainer(async () => {
        //设置启动中状态
        updateServerStatus('starting');

        //启动本地服务
        const startRsp = await execServerStart();
        // console.info(startRsp);
        if (!startRsp) {
            //如果启动失败，直接走杀-启流程
            serverRestart();
            return;
        }

        //启动成功？看看启动没有
        setTimeout(() => {
            serverStart();
        }, SERVERRUNTIME);
    })
}


/**
 * 28006端口是否还有人存活
 * @returns 
 */
const isAliveIn28006 = (): Promise<string | null> => {
    return new Promise((resolve) => {
        const rsp = exec.spawnSync('netstat -aon|findstr "28006"', { shell: true });
        if (rsp.status !== 0) {
            logger.info(CURRENTLOGPREFIX, '28006没有活口1');
            return resolve(null);
        }
        const taskStr = rsp.output.toString();
        if (isNull(taskStr)) {
            logger.info(CURRENTLOGPREFIX, '28006没有活口2');
            return resolve(null);
        }
        const list = taskStr.split('\r\n');
        for (let index = 0; index < list.length; index++) {
            const element = list[index];
            if (element.indexOf('LISTENING') !== -1) {
                const infos = element.trim().split(/\s+/);
                resolve(infos[infos.length - 1]);
                break;
            }
        }
    });
}

/**
 * 通过PID结束进程
 * @param pid 
 */
const killProgramByPid = (pid: string) => {
    exec.spawnSync(`taskkill /f /t /pid ${pid}`, { shell: true });
}

let killCount = 0;

/**
 * 结束28006端口的占用
 */
const kill28006 = async () => {
    killCount = 0;
    while (true) {
        if (killCount >= 9) {
            logger.error(CURRENTLOGPREFIX, "结束28006占用超过最大限制")
            break;
        }
        const pid = await isAliveIn28006();
        if (!isNull(pid)) {
            killProgramByPid(pid!);
            logger.info(CURRENTLOGPREFIX, `结束进程号：${pid} 对28006端口占用完毕`);
            killCount++;
            continue;
        }
        logger.info(CURRENTLOGPREFIX, "结束28006占用成功");
        break;
    }
}
import { app, BrowserWindow, dialog, ipcMain } from "electron";
import { initSplashScreen } from "electron-splashscreen";
import { DialogTopWin, OfficeTemplate } from "./windows/common";
import { AppIcon, LogoBase64Str } from "./icons";
import { registMsgTarget } from "./service/ipcSender";
import initIpcListen from "./service/ipcListener";
import initIpcHander from "./service/ipcHandler";

app.commandLine.appendSwitch("--disable-http-cache");

let mainWindow: BrowserWindow;

app.applicationMenu = null;

/**
 * 退出应用程序
 */
function quitApp() {
  app.quit();
}

async function createWindow() {
  if (process.argv.includes("__updater__")) {
    app.relaunch({
      args: [],
    });
    app.exit(0);
    return;
  }

  // console.log(process.env.__devPlatform__);

  // 幕布窗口, 在应用窗体加载完成之前进行加载遮挡因为应用未加载完成导致的白屏闪烁问题, 窗体加载完成之后调用此处的 方法: hideSplashScreen()
  const hideSplashScreen = initSplashScreen({
    mainWindow: {
      show: () => { },
    },
    url: OfficeTemplate,
    icon: AppIcon,
    width: 800,
    height: 600,
    brand: "电子签章客户端 (v" + require("../package.json").version + ")",
    productName: "chie测试",
    // website: "https://apps.byzk.cn",
    logo: LogoBase64Str,
    backgroundColor: "rgb(102,102,102)",
    color: "rgb(102,102,102)",
    text: "正在加载...",
  });

  mainWindow = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
      sandbox: false,
      contextIsolation: false,
    },
    icon: AppIcon
  });

  mainWindow.webContents.openDevTools()

  //添加渲染进程侦听
  initIpcListen();
  //添加渲染进程handle
  initIpcHander();

  try {
    //展示渲染进程
    await mainWindow.loadURL("http://127.0.0.1:3005");
  } catch (e) { }


  //注册sender发送对象
  registMsgTarget(mainWindow);


  hideSplashScreen();
  // console.info(process.env);
  // serverStart();

}

(async () => {
  // TODO 程序因不可抗拒原因发生崩溃, 可以在本事件中重启程序或记录异常崩溃日志
  process.on("uncaughtException", (error) => {
    if (error) {
      console.log(error);
      dialog.showMessageBoxSync(DialogTopWin(), {
        type: "error",
        title: "致命错误",
        message: error.message,
        icon: AppIcon,
        buttons: ["确定"],
      });
      app.exit(1);
    }
  });

  // TODO 窗体被激活事件
  app.on("activate", () => {
    // CurrentInfo.CurrentWindow?.show();
  });

  // TODO 应用二次启动事件
  app.on("second-instance", () => {
    // CurrentInfo.CurrentWindow?.show();
  });

  const instanceLock = app.requestSingleInstanceLock();
  if (!instanceLock) {
    quitApp();
    return;
  }

  app.on("ready", () => {
    if (process.platform === "darwin") {
      app.dock.hide();
    }

    // 监听渲染进程触发程序退出事件
    ipcMain.addListener("appQuit", () => {
      console.log("app quit ...");
      app.exit(0);
    });

    // initRemoteProxy();
    createWindow();
  });
})();

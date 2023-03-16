import { BrowserWindow, systemPreferences, ipcMain } from "electron";
export var initSplashScreen = function (_a) {
  var mainWindow = _a.mainWindow,
    color = _a.color,
    icon = _a.icon,
    _b = _a.width,
    width = _b === void 0 ? 600 : _b,
    _c = _a.height,
    height = _c === void 0 ? 400 : _c,
    url = _a.url,
    image = _a.image,
    brand = _a.brand,
    productName = _a.productName,
    logo = _a.logo,
    website = _a.website,
    text = _a.text,
    backgroundColor = _a.backgroundColor;
  var col =
    color ||
    (systemPreferences.getAccentColor &&
      "#" + systemPreferences.getAccentColor());
  global["splashScreenImage"] = image || icon;
  var splashScreen = new BrowserWindow({
    width: width,
    height: height,
    parent: mainWindow,
    modal: true,
    transparent: true,
    skipTaskbar: true,
    frame: false,
    autoHideMenuBar: true,
    alwaysOnTop: true,
    resizable: false,
    movable: false,
    icon: icon,
    backgroundColor: backgroundColor,
  });
  var args = {
    brand: brand,
    productName: productName,
    logo: logo,
    website: website,
    color: col,
    text: text,
  };
  splashScreen.on("ready-to-show", () => {
    setTimeout(() => {
      try {
        splashScreen.show();
      } catch (e) {}
    }, 500);
  });
  if (typeof url === "function") {
    var file = "data:text/html;charset=UTF-8," + encodeURIComponent(url(args));
    splashScreen.loadURL(file);
  } else {
    splashScreen.loadURL(
      url + "#" + Buffer.from(JSON.stringify(args)).toString()
    );
  }
  var hide = function () {
    setTimeout(function () {
      return splashScreen.destroy();
    }, 500);
    mainWindow.show();
  };
  ipcMain.on("ready", hide);
  return hide;
};
//# sourceMappingURL=splash-screen.js.map

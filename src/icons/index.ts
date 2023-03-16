import { nativeImage } from "electron";
import path from "path";

let basePath = "../";
if (process.env.NODE_ENV !== "production") {
  basePath = "../../resources";
}

const iconsPath = path.join(__dirname, basePath, "icons");
let tmpAppNativeImage;
let tmpAppOfflineNativeImage;
let tmpAppIconImage;
let tmpAppTrayIcon;
if (process.platform === "darwin") {
  tmpAppNativeImage = nativeImage.createFromPath(
    path.join(iconsPath, "24x24.png")
    // path.join(iconsPath, "app-128.png")
  );
  tmpAppOfflineNativeImage = nativeImage.createFromPath(
    path.join(iconsPath, "24x24.png")
  );
  tmpAppIconImage = nativeImage.createFromPath(
    path.join(iconsPath, "24x24.png")
  );
  tmpAppTrayIcon = nativeImage.createFromPath(
    path.join(iconsPath, "16x16.png")
  );
} else {
  tmpAppNativeImage = nativeImage.createFromPath(
    path.join(iconsPath, "512x512.png")
  );
  tmpAppOfflineNativeImage = nativeImage.createFromPath(
    path.join(iconsPath, "512x512.png")
  );
  tmpAppIconImage = nativeImage.createFromPath(
    path.join(iconsPath, "512x512.png")
  );
  tmpAppTrayIcon = nativeImage.createFromPath(
    path.join(iconsPath, "512x512.png")
  );
  console.log("图标路径: ", path.join(iconsPath, "512x512.png"));
}

export const AppIconLinuxImgPath = path.join(iconsPath, "512x512.png");
export const AppIconImg = tmpAppIconImage;
export const AppIcon = tmpAppNativeImage;
export const AppOfflineIcon = tmpAppOfflineNativeImage;
export const AppTrayIcon = tmpAppTrayIcon;
export const LogoSvg = path.join(iconsPath, "logo.svg");
export * from "./logo";
// export const AppIcon = path.join(iconsPath, "app-256.png");
// export const AppOfflineIcon = tmpAppNativeImage;

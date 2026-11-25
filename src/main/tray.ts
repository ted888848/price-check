import { Tray, Menu, app, nativeImage } from "electron";
import SextantOrb128 from "../assets/SextantOrb128.ico?asset";
import { checkForUpdate } from "./autoUpdate";
import { updateState } from "./autoUpdate";
import { config, updateConfig } from "./config";
import { toggleOverlay, win } from "./overlayWindow";

let tray: Tray;
export function buildTray() {
  const trayMenu = Menu.buildFromTemplate([
    {
      label: "DevTool",
      type: "normal",
      click() {
        win.webContents.openDevTools({
          mode: "detach",
          activate: false,
        });
      },
    },
    {
      label: "打開 Overlay",
      type: "normal",
      click() {
        toggleOverlay();
      },
    },
    {
      label: `目前版本: v${app.getVersion()}`,
      enabled: false,
    },
    {
      label: "POE版本(修改需重啟此App)",
      type: "submenu",
      submenu: [
        {
          label: "1",
          type: "radio",
          checked: config.poeVersion === "1",
          click() {
            if (config.poeVersion === "1") return;
            updateConfig({ poeVersion: "1" });
            app.relaunch();
            app.quit();
          },
        },
        {
          label: "2",
          type: "radio",
          checked: config.poeVersion === "2",
          click() {
            if (config.poeVersion === "2") return;
            updateConfig({ poeVersion: "2" });
            app.relaunch();
            app.quit();
          },
        },
      ],
    },
    {
      enabled: updateState.canClick,
      label: updateState.label,
      type: "normal",
      click() {
        checkForUpdate();
      },
    },
    {
      label: "Quit",
      type: "normal",
      click() {
        app.quit();
      },
    },
  ]);
  tray.setContextMenu(trayMenu);
}

export function setupTray() {
  tray = new Tray(nativeImage.createFromPath(SextantOrb128));
  buildTray();
}

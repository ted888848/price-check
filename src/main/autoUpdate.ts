import { dialog } from "electron";
import { autoUpdater } from "electron-updater";
import { buildTray } from "./tray";

export const updateState = {
  label: "",
  canClick: true,
};
autoUpdater.on("update-available", ({ version, releaseNotes }) => {
  updateState.label = `下載新版本 v${version}中`;
  updateState.canClick = false;
  buildTray();
  dialog.showMessageBox({
    title: "有新版本",
    type: "info",
    message: `有新版本 v${version}，並已經開始在背景下載\n
    ${releaseNotes?.toString().replaceAll(/<[/]?(ul|li)>/g, "")}`,
  });
});
autoUpdater.on("update-downloaded", () => {
  updateState.label = "下載完成，關閉後將自動安裝";
  updateState.canClick = false;
  buildTray();
  dialog
    .showMessageBox({
      title: "下載完成",
      type: "info",
      message: "更新安裝擋已經下載完成，如果沒有自動重新啟動，\n請手動離開後稍等安裝完畢再打開",
      buttons: ["重新開啟並安裝更新", "稍後再安裝"],
      defaultId: 0,
    })
    .then((result) => {
      if (result.response === 0) {
        setImmediate(() => {
          autoUpdater.quitAndInstall();
        });
      }
    });
});
autoUpdater.on("update-not-available", () => {
  updateState.label = "目前沒有新版本";
  updateState.canClick = true;
  buildTray();
});
export async function checkForUpdate() {
  updateState.label = "檢查更新中";
  updateState.canClick = false;
  buildTray();
  try {
    await autoUpdater.checkForUpdates();
  } catch {
    updateState.label = "檢查更新錯誤";
    updateState.canClick = true;
    buildTray();
  }
}

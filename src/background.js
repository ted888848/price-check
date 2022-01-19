'use strict';
import { app, protocol } from 'electron';
// import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer';
import { setupShortcut } from './utility/shortcuts'
import { createWindow } from './utility/overlayWindow'
import { setupTray } from './utility/tray';
import { checkAPIdata } from './utility/setupAPI'
import { setupConfig } from './utility/config'
const isDevelopment = process.env.NODE_ENV !== 'production';
protocol.registerSchemesAsPrivileged([
    { scheme: 'app', privileges: { secure: true, standard: true } }
]);
app.disableHardwareAcceleration()
// Quit when all windows are closed.
app.on('window-all-closed', () => {  
    if (process.platform !== 'darwin') {
        app.quit();  
    }
});
// app.on('activate', () => { 
//     // On macOS it's common to re-create a window in the app when the
//     // dock icon is clicked and there are no other windows open.
//     if (BrowserWindow.getAllWindows().length === 0)
//         createWindow(); 
// });   
app.on('ready', async () => {     
    // if (isDevelopment && !process.env.IS_TEST) {     
    //     // Install Vue Devtools
    //     try {
    //         await installExtension(VUEJS_DEVTOOLS);
    //     }
    //     catch (e) {
    //         console.error('Vue Devtools failed to install:', e.toString());
    //     }
    // } 
    setupConfig()
    setupTray() 
    await checkAPIdata()
    await createWindow()
    setupShortcut()
    
}); 

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
    if (process.platform === 'win32') {
        process.on('message', (data) => {
            if (data === 'graceful-exit') {
                app.quit();
            }
        });
    }
    else {
        process.on('SIGTERM', () => {
            app.quit();
        });
    }
}  


'use strict';
import { app, protocol } from 'electron';
import { setupShortcut } from './utility/shortcuts'
import { createWindow } from './utility/overlayWindow'
import { setupTray } from './utility/tray';
import { checkAPIdata, checkForUpdate } from './utility/setupAPI'
import { setupConfig } from './utility/config'
const isDevelopment = process.env.NODE_ENV !== 'production';
protocol.registerSchemesAsPrivileged([
    { scheme: 'app', privileges: { secure: true, standard: true } }
]);
app.disableHardwareAcceleration()
app.on('window-all-closed', () => {  
    if (process.platform !== 'darwin') {
        app.quit();  
    }
});
app.on('ready', async () => {     
    setupConfig()
    setupTray() 
    await checkAPIdata()
    await createWindow()
    checkForUpdate()
    setupShortcut()
}); 
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


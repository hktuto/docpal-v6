import {BrowserWindow} from "electron";
import path from "path";
import {havePrefs} from './pref'

export const createWindow = (mainWindow:BrowserWindow) =>{
  const isMac = process.platform === 'darwin'
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 1920,
        height: 1080,
        transparent: isMac ? true : false,               // Make background transparent (optional)
        titleBarStyle: isMac ? 'hidden' : 'default',         // macOS only: hide title bar but keep traffic lights
        trafficLightPosition: { x: 10, y: 10 }, // macOS: position the traffic lights
        webPreferences: {
            nodeIntegration:true,
            webSecurity: false,
            preload: path.join(__dirname, 'preload.js')
        }
    })
    const pref = havePrefs()
    if(pref) {
       const url = pref.DOCPAL_END_POINT.includes('localhost') ? 'http://'+pref.DOCPAL_END_POINT : 'https://'+pref.DOCPAL_END_POINT
        mainWindow.loadURL(url);
    }
    
    // mainWindow.webContents.openDevTools()
    return mainWindow
}

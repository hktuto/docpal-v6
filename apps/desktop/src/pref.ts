import { BrowserWindow, app } from 'electron'
import path from 'path'
import fs from 'fs'

export const havePrefs = () => {
  const prefsPath = path.resolve(app.getPath('userData'), 'prefs.json')
  if (fs.existsSync(prefsPath)) {
    // read prefs file and return json
    const prefs = fs.readFileSync(prefsPath, 'utf-8')
    return JSON.parse(prefs)
    // return false
  } else {
    return false
  }
}

export const removePrefs = () => {
  const prefsPath = path.resolve(app.getPath('userData'), 'prefs.json')

  // remove prefs file
  if (fs.existsSync(prefsPath)) {
    fs.unlinkSync(prefsPath)
  }
}

export const setPrefs = (jsonData: any) => {
  const prefsPath = path.resolve(app.getPath('userData'), 'prefs.json')
  fs.writeFileSync(prefsPath, JSON.stringify(jsonData))
}

export const createSetPrefFrontend = (mainWindow: BrowserWindow): BrowserWindow => {
  mainWindow = new BrowserWindow({
    width: 640,
    height: 480,
    transparent: true,               // Make background transparent (optional)
    titleBarStyle: 'hidden',         // macOS only: hide title bar but keep traffic lights
    trafficLightPosition: { x: 10, y: 10 }, // macOS: position the traffic lights
    webPreferences: {
      nodeIntegration: true,
      webSecurity: false,
      contextIsolation: false
    }
  })
  mainWindow.loadFile(path.join(process.env.ROOT, 'pref/index.html'))
  return mainWindow
}

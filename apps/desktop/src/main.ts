import { app, BrowserWindow, ipcMain, shell, dialog, ipcRenderer, Menu, Notification } from 'electron'
import path from 'path'
import { createSetPrefFrontend, havePrefs, setPrefs, removePrefs } from './pref'
import { createAppClient } from './app'

export const MAIN_DIST = path.join(__dirname, '../dist')

// set up env

process.env.ROOT = path.join(__dirname, '..')
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

let mainWindow: BrowserWindow
let isFocused: boolean = false
let isMinimized: boolean = false

app.requestSingleInstanceLock()
app.setAsDefaultProtocolClient('docpal')

app.whenReady().then(async () => {
  const alreadyHavePrefs = havePrefs()

  if (alreadyHavePrefs) {
    mainWindow = createAppClient(mainWindow)
  } else {
    mainWindow = createSetPrefFrontend(mainWindow)
  }

  mainWindow.on('focus', () => {
    isFocused = true
  })

  mainWindow.on('blur', () => {
    isFocused = false
  })

  mainWindow.on('minimize', () => {
    isMinimized = true
    isFocused = false
  })
})

app.on('window-all-closed', function() {
  app.quit()
})

ipcMain.handle('setBaseUrl', (event, url) => {
  mainWindow.close()
  const setting = {
    'pdfReaderUrl': `https://${url}/resources/pdfjs/web/viewer.html`,
    'PROXY': `https://${url}/api`,
    'DASHBOARD_PROXY': `https://${url}/public-api/report/v1/api`,
    'CLIENT_PROXY': `https://${url}/api`,
    'ADMIN_PROXY': `https://admin.${url}/api`,
    'endPoint': 'client',
    'DEFAULT_PATH': '/browse',
    'OFFICE_END_POINT': `office.${url}`,
    'UPLOAD_END_POINT': `upload.${url}`,
    'DOCPAL_END_POINT': `${url}`,
    'ADMIN_END_POINT': `admin.${url}`
  }
  setPrefs(setting)
  mainWindow = createAppClient(mainWindow)
})

ipcMain.handle('removeBaseUrl', () => {
  removePrefs()
  console.log('removeBaseUrl')
  mainWindow.close()
  mainWindow = createSetPrefFrontend(mainWindow)
})

// ipcMain.on('dragTagToWindow', (event,args)=> {
//     const data = JSON.parse(args)
//     // get mainWindow x y
//     const mainWindow = BrowserWindow.getAllWindows()[0]
//     const mainWindowBounds = mainWindow.getBounds()

//     let newWindow:any = new BrowserWindow({
//         width: 1280,
//         height: 720,
//         webPreferences: {
//           contextIsolation: false,
//           preload: path.join(MAIN_DIST, 'preload.js'),
//       },
//     })

//     newWindow.loadURL(
//         'http://localhost:3000/tab?arg=' + btoa(encodeURIComponent(args))
//     )

//     newWindow.webContents.openDevTools()
//     newWindow.on('closed', () => {
//         newWindow = null
//     })
// })

export function createMenu() {
  const isMac = process.platform === 'darwin'
  const template: any[] = [
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    }] : []),
    {
      label: 'File',
      submenu: [
        isMac ? { role: 'close' } : { role: 'quit' }
      ]
    },
    {
      role: 'help',
      submenu: [
        {
          label: 'reset',
          click: async () => {
            removePrefs()
            console.log('removeBaseUrl')
            mainWindow.close()
            mainWindow = createSetPrefFrontend(mainWindow)
          }
        },
        {
          label: 'debug',
          click: async () => {
            mainWindow.webContents.openDevTools()
          }
        }
      ]
    }
  ]
  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

/**
 * callback
 * @param data {title: message title, id: message Id}
 */
ipcMain.handle('sendNotification', (event, data: any) => {
  console.log('sendNotification', isFocused, event)
  if (!isFocused) {
    notificationController(data.title, data.id)
  }
})

/**
 * Send operating system notifications
 * @param title 顯示的標題
 * @param body message ID
 */
export function notificationController(title: string, body: string) {
  const options = {
    icon: './public/icon.png',
    title: 'Docpal',
    subtitle: '',
    body: body,
    silent: true
  }

  const platform = process.platform
  if (platform === 'win32') {
    // Windows
    options.title = title
  } else if (platform === 'darwin') {
    // macOS
    options.subtitle = title
  } else if (platform === 'linux') {
    // Linux
  }

  const notification = new Notification(options)

  // user click event
  notification.on('click', () => {
    if (mainWindow) {
      mainWindow.show()
      mainWindow.focus()
      mainWindow.webContents.send('navigate-to', body)
    }
  })
  notification.show()
}

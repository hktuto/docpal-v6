import { contextBridge, ipcRenderer, Notification } from 'electron'
//@ts-ignore
window.ipcRenderer = require('electron').ipcRenderer

contextBridge.exposeInMainWorld('shell', {
  open: () => ipcRenderer.send('shell:open'),

  close: () => ipcRenderer.send('shell:close')
})

contextBridge.exposeInMainWorld('windowState', {
  isFocused: () => new Promise<boolean>((resolve) => {
    ipcRenderer.once('reply-focused', (_event, focused: boolean) => {
      resolve(focused)
    })
    ipcRenderer.send('check-focused')
  })
})

window.addEventListener('removeBaseUrl', () => {
  console.log('removeBaseUrl event called')
  ipcRenderer.invoke('removeBaseUrl')
})

window.addEventListener('dragTagToWindow', (event: any) => {
  console.log('preload dragTagToWindow', event)

  ipcRenderer.send('dragTagToWindow', JSON.stringify(event.detail))
})

window.addEventListener('sendMessage', (event: any) => {
  console.log('Message notification', event)

  const checkFocused = () => new Promise<boolean>((resolve) => {
    ipcRenderer.once('reply-focused', (_e, focused: boolean) => resolve(focused))
    ipcRenderer.send('check-focused')
  })

  checkFocused().then((focused) => {
    if (focused) {
      return
    }
    new Notification({ title: 'qwe', body: 'asdzxc' }).show()
  })
})
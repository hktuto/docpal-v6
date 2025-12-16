import { contextBridge, ipcRenderer } from 'electron'
//@ts-ignore
const notifier = require('node-notifier');

//@ts-ignore
window.ipcRenderer = require('electron').ipcRenderer

contextBridge.exposeInMainWorld('shell', {
  open: () => ipcRenderer.send('shell:open'),

  close: () => ipcRenderer.send('shell:close')
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
    notifier.notify({
      title: 'My notification',
      message: 'Hello, there!'
    });
  })
})
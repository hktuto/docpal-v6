import { contextBridge, ipcRenderer } from 'electron'
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

/**
 * send desktop system message
 * @param event { title: string, id: string }
 */
window.addEventListener('sendDesktopMessage', (event: any) => {
  console.log('Message notification', event)
  ipcRenderer.invoke('sendNotification', event)
})

/**
 * Open message dialog
 */
ipcRenderer.on('navigate-to', (event, messageId) => {
  window.dispatchEvent(new CustomEvent('urlToRouterObject', messageId))
})
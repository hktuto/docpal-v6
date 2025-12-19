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

// send desktop system message
window.addEventListener('sendMessage', (event: any) => {
  console.log('Message notification', event)
  const message = JSON.parse(JSON.parse(event.detail.messageJson.content).message)
  let title = 'Message'
  let notifyMessage = message.additionalContent
  ipcRenderer.invoke('sendNotification', { title, notifyMessage }).then(r => console.log(r))
})

// Route jump
ipcRenderer.on('navigate-to', (event, routeData) => {
  const { path, data } = routeData

  window.location.href = `${path}?caseId=${encodeURIComponent(data)}`
})
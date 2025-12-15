import {contextBridge, ipcRenderer } from 'electron'
//@ts-ignore
window.ipcRenderer = require('electron').ipcRenderer;
//@ts-ignore
window.isDesktopMode = true

contextBridge.exposeInMainWorld('shell', {
    open: () => ipcRenderer.send('shell:open'),

    close: () => ipcRenderer.send('shell:close'),

})

window.addEventListener('removeBaseUrl', () => {
    console.log("removeBaseUrl event called")
    ipcRenderer.invoke('removeBaseUrl')
})


window.addEventListener('dragTagToWindow', (event:any) => {
    console.log("preload dragTagToWindow", event)
    
    ipcRenderer.send('dragTagToWindow', JSON.stringify(event.detail))
})

window.addEventListener('sendMessage',(event:any)=>{
  console.log('Message notification', event)

})
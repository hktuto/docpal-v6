import {
  VxeUI,
  VxeButton,
  VxeInput,
  VxeRate
} from 'vxe-pc-ui'

function lazyVxeUI (app:any) {
  app.use(VxeButton)
  app.use(VxeInput)
  app.use(VxeRate)
}


export default defineNuxtPlugin(nuxtApp => {
  console.log('vxe.component.register')
  nuxtApp.vueApp.use(lazyVxeUI)
});

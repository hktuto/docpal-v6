import { useEventBus, EventType } from 'eventbus'

let interval: any
export default defineNuxtPlugin(nuxtApp => {
  const { connect, disconnect, messageHandlers, notiData, notiError } = useNotification()
  const loginBus = useEventBus(EventType.USER_LOGIN__SUCCESS)
  loginBus.on((data) => {
    connect()
  })
  const logoutBus = useEventBus(EventType.USER_LOGIN__EXPIRE)
  logoutBus.on((data) => {
    disconnect()
  })

  watch(notiData, () => {
    if (!notiData.value) return
    messageHandlers.value.forEach((handler) => {
      handler.handler(JSON.parse(notiData.value))
    })
    // send system notification
    window.dispatchEvent(new CustomEvent('sendMessage', { detail: JSON.parse(notiData.value) }))

    // messageChangeCB(JSON.parse(notiData.value))
  })

  watch(notiError, () => {
    if (!notiError.value) return
    if (interval) clearInterval(interval)
    console.log('notiError：', notiError.value)
    interval = setInterval(() => {
      console.log('notiError：setInterval,', notiError.value)
      // start()
      clearInterval(interval)
    }, 10000)
  })
})
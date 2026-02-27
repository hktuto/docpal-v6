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
    // TODO 等待新的消息通知格式. https://wclconsultancy.atlassian.net/wiki/spaces/DocPal/pages/1247444997/Notification+Type+Schema
    // Send System Desktop Notification
    window.dispatchEvent(new CustomEvent('sendDesktopMessage', { detail: { title: '', id: '' } }))
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
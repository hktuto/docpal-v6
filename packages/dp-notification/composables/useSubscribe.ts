// @ts-ignore

import { clientApi } from 'api'

export const useSubscribe = () => {
  const subscribeList = useState('subscribeList', () => [])

  // @ts-ignore
  async function getSubscribeList() {
    const userId = useUserId()
    subscribeList.value = await clientApi.api.getNotificationSubscriberSubscriberFoldersList(userId.value).then(r => r.data)
  }

  function isSubscribe(folderId: string) {
    return subscribeList.value.find((item) => item.id === folderId)
  }

  async function subscribe(folderId: string) {
    const userId = useUserId()
    await clientApi.api.postNotificationSubscriber({
      idOrPath: folderId,
      subscriber: userId.value
    })
    await getSubscribeList()
  }

  async function unSubscribe(folderId: string) {
    const userId = useUserId()
    await clientApi.api.deleteNotificationSubscriberSubscriberIdorpathIdorpath(userId.value, folderId)

    await getSubscribeList()
  }

  async function toggleSubscribe(folderId: string) {
    if (isSubscribe(folderId)) {
      await unSubscribe(folderId)
    } else {
      await subscribe(folderId)
    }
  }

  onMounted(async () => {
    await getSubscribeList()
  })

  return {
    toggleSubscribe,
    subscribeList,
    isSubscribe
  }
}

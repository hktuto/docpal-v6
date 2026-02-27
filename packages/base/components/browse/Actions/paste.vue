<script lang="ts" setup>
import { emitBus, EventType } from 'eventbus'
import { ElMessage } from 'element-plus'
import { useEventListener } from '@vueuse/core'
import { Loading } from '@element-plus/icons-vue'
import { ElNotification, ElMessageBox } from 'element-plus'

import { newClientApi } from 'api'

const { t } = useI18n()
const emits = defineEmits(['success'])
const copyDocumentList = useCopyDocumnetList()
const routerProvider = inject(MenuRouterKey)

function copyItem(doc) {
  copyDocumentList.value = [
    {
      type: 'copy',
      doc: doc
    }
  ]
  ElMessage({
    message: doc.name + ' ' + t('filePopover_copy') as string,
    type: 'success'
  })
}

function cutItem(doc) {
  copyDocumentList.value = [
    {
      type: 'cut',
      doc: doc
    }
  ]
  ElMessage({
    message: doc.name + ' ' + t('filePopover_cut') as string,
    type: 'success'
  })
}

async function pasteItem(doc) {
  const item = copyDocumentList.value[0]
  if (!item) return
  const type = item.type
  const copyItem = item.doc
  const param = [
    { idOrPath: copyItem.id },
    { idOrPath: doc.path }
  ]
  const data = await duplicateNameFilter(doc.path, [{ idOrPath: copyItem.id, name: copyItem.name }])
  const noti = ElNotification({
    title: t('filePopover_paste'),
    icon: Loading,
    dangerouslyUseHTMLString: true,
    message: `<div title="${copyItem.name}">${copyItem.name}</div>`,
    showClose: true,
    customClass: 'loading-notification',
    duration: 0,
    position: 'bottom-right'
  })
  let msg = ''
  try {
    if (data.isDuplicate) {
      const promises = []
      for (let i = 0; i < data?.titleList.length; i++) {
        const item = data.titleList[i]
        const promise = ElMessageBox.confirm(t('browse_duplicateFileNameMsg', { itemName: item.name }),
          {
            confirmButtonClass: 'el-button el-button--warning',
            dangerouslyUseHTMLString: true,
            confirmButtonText: t('confirm')
          }
        ).then(async ({ value }) => {
          if (type === 'copy') {
            const copyResponse = await newClientApi.postDmsDocumentCopy(param).then(res => res.data)
            await newClientApi.patchDmsDocument({
              idOrPath: copyResponse.id,
              name: item.newName
            })
            msg = t('common_copySuccess')
          } else {
            await newClientApi.postDmsDocumentMove(param).then(r => r.data)
            await newClientApi.patchDmsDocument({
              idOrPath: copyItem.id,
              name: item.newName
            })
            msg = t('common_moveSuccess')
          }
        }).catch(() => {
          console.log('close')
        })
        promises.push(promise)
      }
      await Promise.all(promises)
    } else {
      if (type === 'copy') {
        await newClientApi.postDmsDocumentCopy(param).then(r => r.data)
        msg = t('common_copySuccess')
      } else {
        await newClientApi.postDmsDocumentMove(param).then(r => r.data)
        msg = t('common_moveSuccess')
      }
    }
    routerProvider?.message.success(msg)
    emitBus(EventType.FILE_NEED_REFRESH, {
      relatedIdOrPath: doc.id
    })
  } catch (error) {
    console.log(error)
  } finally {
    noti.close()
  }
}

onMounted(() => {
  useEventListener(document, 'docActionCopy', (event: any) => copyItem(event.detail))
  useEventListener(document, 'docActionCut', (event: any) => cutItem(event.detail))
  useEventListener(document, 'docActionPaste', (event: any) => pasteItem(event.detail))
})
</script>

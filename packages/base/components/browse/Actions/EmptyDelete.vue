<template>
  <!-- <SvgIcon src="/icons/file/delete.svg" round content="delete"
              @click="deleteItem(doc)"></SvgIcon> -->
  <div></div>
</template>

<script lang="ts" setup>
import { emitBus, EventType } from 'eventbus'

import { useEventListener } from '@vueuse/core'
import { Loading } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import { clientApi } from 'api'

const emits = defineEmits(['delete', 'success'])
const { t } = useI18n()

/**
 * @param doc
 * @param deleteType 区分 detail folder,detail file, right-click
 */
async function deleteItem(doc: any, deleteType?: 'folder' | 'file') {
  const idOrPath = doc.path
  let msg = ''
  const isShareInternal = await clientApi.api.postDmsInternalshareCheckDocumentIsInShare({
    documentId: doc.id
  })
  if (isShareInternal) msg += `<span class="color__danger">${doc.name} ${t('msg_isShareInternalFile')}</span>,`
  msg += t('tip_deleteSuccessMessage', { name: t('common_item') })
  const action = await ElMessageBox.confirm(msg, {
    confirmButtonClass: 'el-button el-button--warning',
    dangerouslyUseHTMLString: true,
    confirmButtonText: t('common_confirmDelete')
  }).catch(action => action)
  if (action !== 'confirm') return
  const noti = ElNotification({
    title: t('dpTip_delete'),
    icon: Loading,
    dangerouslyUseHTMLString: true,
    message: `<div title="${doc.name}">${doc.name}</div>`,
    showClose: true,
    customClass: 'loading-notification',
    duration: 0,
    position: 'bottom-right'
  })
  try {
    const response = await clientApi.api.deleteNuxeoDocumentTrash([{ idOrPath }])
    if (deleteType === 'file') {
      const ev = new CustomEvent('closeFilePreview', { detail: doc })
      document.dispatchEvent(ev)
      emits('delete', idOrPath)
    } else if (deleteType === 'folder') {
      const ev = new CustomEvent('closeFilePreview', { detail: doc })
      document.dispatchEvent(ev)
      emits('delete', idOrPath)
    } else {
      emits('success', doc)
    }
    ElMessage.success(t('tip_deleteSuccessMessage', { name: t('common_item') }))
    ElNotification({
      title: 'Success',
      message: 'Item deleted',
      type: 'success',
      duration: 2000
    })
    emitBus(EventType.FILE_NEED_REFRESH, {
      relatedIdOrPath: doc.parentRef
    })
  } catch (error: any) {
    console.error(error)
  } finally {
    noti.close()
  }
}

useEventListener(document, 'docActionDelete', (event: any) => deleteItem(event.detail, event.detail.deleteType))
</script>

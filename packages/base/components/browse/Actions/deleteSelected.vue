<template>
  <BrowseActionsButton id="deleteSelectActionButton" :label="$t('tip.deleteSelected')" @click="deleteSelected()">
    <SvgIcon src="/icons/file/delete.svg" round :content="$t('tip.deleteSelected')"></SvgIcon>
  </BrowseActionsButton>
</template>

<script lang="ts" setup>
import { Loading } from '@element-plus/icons-vue'
import { ElNotification, ElMessageBox } from 'element-plus'
import { newClientApi } from 'api'

const props = defineProps<{
  selectedList: any
}>()
const emits = defineEmits(['success'])
const { t } = useI18n()

async function deleteSelected() {
  let msg = await checkAllShareInternal()
  msg += t('msg_confirmWhetherToDelete')
  const action = await ElMessageBox.confirm(msg, {
    dangerouslyUseHTMLString: true
  }).catch(action => action)
  if (action !== 'confirm') return

  const noti = ElNotification({
    title: t('dpTip_delete'),
    icon: Loading,
    dangerouslyUseHTMLString: true,
    showClose: true,
    customClass: 'loading-notification',
    duration: 0,
    position: 'bottom-right'
  })
  try {
    const params = props.selectedList.map((item: any) => ({ idOrPath: item.id }))
    await newClientApi.deleteDmsDocumentTrashBatch(params).then(r => r.data)
    emits('success')
    ElNotification({
      title: 'Success',
      message: 'Items deleted',
      type: 'success',
      duration: 2000
    })
  } catch (error: any) {
    console.error(error)
  } finally {
    noti.close()
  }
}

async function checkAllShareInternal() {
  let msg = ''
  let pList: any = []
  props.selectedList.forEach((element: any) => {
    pList.push(checkShareInternal(element))
  })
  await Promise.all(pList)
  return msg ? `<span class="color__danger">${msg} ${t('msg_isShareInternalFile')}, </span>` : ''

  async function checkShareInternal(row: any) {
    const {data:isShareInternal} = await newClientApi.postDmsInternalshareCheckDocumentIsInShare({
      documentId: row.id
    })
    if (msg) msg += ','
    if (isShareInternal) msg += row.name
  }
}

onMounted(() => {
})
</script>

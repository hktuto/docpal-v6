<script lang="ts" setup>
import { Loading } from '@element-plus/icons-vue'
import { ElMessageBox, ElNotification } from 'element-plus'
import { clientApi } from 'api'

const { t } = useI18n()
const { id } = defineProps<{
  id: string
}>()
const state = reactive<{
  loading: boolean
  setting: any
  currentRow: any
}>({
  loading: false,
  setting: {},
  currentRow: {}
})

async function getData() {
  state.loading = true
  try {
    state.setting = await clientApi.admin.getAdmindmsCabinetTemplateId(id).then((res) => res.data)
    state.setting.folder = true
  } catch (error) {
  } finally {
    state.loading = false
  }
}

const detailRef = ref()

function handleCurrentChange(row: any, node: any) {
  state.currentRow = row
  detailRef.value.init(row)
}

const FolderCabinetAddChildDialogRef = ref()

function handleAddChild(data: any, isFolder: boolean) {
  FolderCabinetAddChildDialogRef.value.handleOpen(data, data.children, isFolder)
}

async function handleDeleteChild(setting: any) {
  let noti: any
  try {
    const action = await ElMessageBox.confirm(`${t('msg_confirmWhetherToDelete')}`)
    if (action !== 'confirm') return
    console.log(action)
    noti = ElNotification({
      title: t('dpTip_delete'),
      icon: Loading,
      dangerouslyUseHTMLString: true,
      message: `<div title="${setting.label}">${setting.label}</div>`,
      showClose: true,
      customClass: 'loading-notification',
      duration: 0,
      position: 'bottom-right'
    })
    await clientApi.admin.deleteAdmindmsCabinetId(setting.id)
    await getData()
    ElNotification({
      title: 'Success',
      message: 'Item deleted',
      type: 'success',
      duration: 2000
    })
  } catch {
    ElNotification({
      title: 'Error',
      message: 'Failed to delete item',
      type: 'error',
      duration: 2000
    })
  } finally {
    if (noti) noti.close()
  }
}

provide('handleAddChild', handleAddChild)
provide('handleDeleteChild', handleDeleteChild)

// no cache on this page
defineOptions({
  name: 'FolderCabinetSettingDetailDead'
})
onMounted(() => {
  getData()
})
onUnmounted(() => {
  state.setting = {}
  state.currentRow = {}
})
</script>
<template>
  <div class="pageContainer--padding main">
    <FolderCabinetSettingTree v-if="state.setting" :data="state.setting" :id="state.currentRow?.id" @current-change="handleCurrentChange" />
    <FolderCabinetSettingDetail ref="detailRef" :tree="state.setting" :data="state.currentRow" :isRoot="state.currentRow?.id === id" @update="getData" />
    <FolderCabinetSettingAddChildDialog ref="FolderCabinetAddChildDialogRef" @update="getData" />
  </div>
</template>
<style lang="scss" scoped>
.main {
  height: 100%;
  overflow: hidden;
  display: grid;
  grid-template-columns: 400px 1fr;
  gap: var(--app-space-s);
}

.FolderCabinetCard {
  height: 100%;
  background-color: #f1f1f1;
  overflow: auto;
}

.doc-container {
  display: grid;
  grid-template-columns: min-content 1fr;
}
</style>

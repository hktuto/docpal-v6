<template>
  <el-dialog v-model="state.visible" :title="$t('dpTip_warning')" :close-on-click-modal="false">
    <h3>{{ $t('folderCabinet.workflowTip') }}</h3>
    <ul>
      <li v-for="item in state.list" :key="item.name">{{ item.name }}</li>
    </ul>
    <template #footer>
      <el-button id="FolderCabinetSetting__Info__Save__Confirm" type="primary" :loading="state.loading" @click="state.visible = false">
        {{ $t('confirm') }}
      </el-button>
    </template>
  </el-dialog>
</template>
<script lang="ts" setup>
import { newAdminApi } from 'api'

const props = defineProps<{
  id: string
}>()
const state = reactive<any>({
  loading: false,
  visible: false,
  list: []
})

function handleOpen() {
  state.visible = true
}

async function handleCheck() {
  try {
    const res = await newAdminApi.getDmsCabinetIdUseWorkflow(props.id).then((res) => res.data)
    if (!!res) state.list = res
  } catch (error) {
  } finally {
    if (state.list.length > 0) handleOpen()
  }
}

defineExpose({ handleOpen, handleCheck })
</script>
<style lang="scss" scoped></style>

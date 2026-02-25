<template>
  <div class="pageContainer--padding externalStorage-profileDetail">
    <el-tabs v-model="activeName" class="dp-tabs--auto">
      <el-tab-pane :label="$t('externalStorage.generate')" name="generate">
        <ExternalStorageProfilesGenerate v-bind="props" :settings="profile" @update="init" />
      </el-tab-pane>
      <el-tab-pane :label="$t('externalStorage.import')" name="import">
        <ExternalStorageProfilesImport lazy v-bind="props" :settings="profile?.import_setting" @update="init" />
      </el-tab-pane>
      <el-tab-pane :label="$t('externalStorage.process')" name="process">
        <ExternalStorageProfilesProcess lazy v-bind="props" :settings="profile?.process_setting" @update="init" />
      </el-tab-pane>
      <el-tab-pane :label="$t('externalStorage.capture')" name="capture">
        <ExternalStorageProfilesCapture lazy v-bind="props" :settings="profile?.capture_setting" @update="init" />
      </el-tab-pane>
      <el-tab-pane :label="$t('externalStorage.output')" name="output">
        <ExternalStorageProfilesOutput lazy v-bind="props" :captureSetting="profile?.capture_setting" />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>
<script lang="ts" setup>
import { newAdminApi } from 'api'

const props = defineProps<{
  id: string,
  storageId: string
}>()
const loading = ref(false)
const profile = ref<any>(null)
const routerProvider = inject(MenuRouterKey)
const activeName = ref('output')
if (!routerProvider) {
  throw new Error('MenuRouterKey is not provided')
}

async function init() {
  try {
    loading.value = true
    profile.value = await newAdminApi.getExt3rdstorageIdProfilesProfileid(props.storageId, props.id).then((res) => res.data)
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  init()
})
</script>
<style lang="scss" scoped>
.actions {
  width: 100%;
  display: flex;
  flex-flow: row nowrap;
  gap: var(--app-space-xs);
  align-items: center;
  justify-content: flex-start;
  --icon-size: var(--app-font-size-m);
}

</style>

<script lang="ts" setup>
import { clientApi } from "api";
import { onMounted } from "vue";
const { id } = defineProps<{
  id: string;
}>();
const { t } = useI18n()
const state = reactive<any>({
    isBrowse: false,
    breadcrumbs: [
        { path: '/smartFolder', icon: '/icons/home.svg'},
        { path: '/smartFolderDetail', name: t('file_smartFolder')}
    ],
})
let sfolder: any = null
let searchParams: any = {}
const tableRef = ref()
async function getSfolder() {
  const sfSetting = sessionStorage.getItem('smartFolder')
  if(!sfSetting) {
      const sfolderList = await clientApi.api.getDmsSmartFolder().then(res => res.data)
      sfolder = sfolderList?.find(item => item.id === id)
  } else {
    sfolder = JSON.parse(sfSetting) 
  }
  state.breadcrumbs[1].name = sfolder.name
  state.breadcrumbs[1].path = `/smartFolderDetail`
  state.breadcrumbs[1].id = id
  searchParams = JSON.parse(sfolder.json_value)
  if(!searchParams) searchParams = {}
  if(!searchParams.query) searchParams.query = []
  tableRef.value.initBar(searchParams)
}
onMounted(() => {
  getSfolder()
})
</script>
<template>
<div class="pageContainer--padding smartFolder">
  <SearchGroupTable ref="tableRef" :tableId="'smart-folder-versions-' + id">
    <template #toolbar_buttons>
      <SmartFolderBreadCrumb :breadcrumbs="state.breadcrumbs"></SmartFolderBreadCrumb>
    </template>
  </SearchGroupTable>

</div>
</template>
<style lang="scss" scoped>
</style>

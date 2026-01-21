<script lang="ts" setup>
import { ElMessageBox } from 'element-plus'
import { clientApi } from 'api'
import { DamListTable } from '#components'
// deepCopy, GetDocDetailApi

// #region  tree
const tabProvider = inject(TabManagerKey)
const routerProvider = inject(MenuRouterKey)
if (!tabProvider || !routerProvider) {
  throw new Error('MenuRouterKey is not provided')
}
// #endregion
const tableRef = ref<InstanceType<typeof DamListTable>>()
const tableData = ref([])
const filteredData = ref<any[]>()
const { t } = useI18n()

function handleKeywordFilter(data: any) {
  console.log('handleKeywordFilter', data)
}

async function handleDelete(tag: any) {
  const action = await ElMessageBox.confirm(`${t('msg_confirmWhetherToDelete')}`, {
    confirmButtonText: `${t('dpButtom_confirm')}`,
    cancelButtonText: `${t('dpButtom_cancel')}`
  }).catch((action: any) => {
    return action
  })
  if (action !== 'confirm') return
  await clientApi.api.deleteDmsDamSettingsBatch([tag.id])
  refresh()
}

function handleDialog(data?: any) {
  DamDialogRef.value.handleOpen(deepCopy(data))
}

const DamDialogRef = ref()

function refresh() {
  tableRef.value?.reload()
}

provide(DamProviderKey, {
  getListApi: async (params: any) => {
    console.log('getListApi', params, filteredData.value)
    const { list } = await clientApi.api.getDmsDamSettingsList().then(r => r.data) as any
    const data = mergeDataByKey(list, 'sourceType') as any

    tableData.value = data
    return data
  },
  handleDialog,
  handleDelete
})
</script>

<template>
  <div class="pageContainer--padding">
    <DamListTable ref="tableRef">
      <template #toolbar_buttons>
        <div class="filter-container">
          <KeywordFilter
            :list="tableData"
            attr="sourceType"
            @filter="handleKeywordFilter"
          ></KeywordFilter>
          <el-button id="DAMSetting__Add" class="button-add" type="primary" @click="handleDialog()">
            {{ $t('common_add') }}
          </el-button>
        </div>
      </template>
    </DamListTable>
    <DamDialog ref="DamDialogRef" @refresh="refresh"></DamDialog>
  </div>
</template>

<style lang="scss" scoped>

</style>

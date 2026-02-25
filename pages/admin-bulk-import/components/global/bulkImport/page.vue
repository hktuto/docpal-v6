<script lang="ts" setup>
import { newAdminApi } from 'api'
import { BulkImportListTable } from '#components'
import { newBulkImportDetail } from '~/utils/bulkImportRouter'
import { ElMessageBox } from 'element-plus'

const routerProvider = inject(MenuRouterKey)

if (!routerProvider) {
  throw createError('provider not found')
}
const { t } = useI18n()
const props = defineProps<{
  orderBy?: string,
  isDesc?: boolean,
  filters?: any
}>()

const allMetaSetting = ref<any>()
const allMetaList = ref<any>()
const MetaAddDocTypeDialogRef = ref()

function handleAdd() {
  MetaAddDocTypeDialogRef.value.handleOpen(allMetaList.value)
}

const tableRef = ref<InstanceType<typeof BulkImportListTable>>()
provide(BulkImportListProviderKey, {
  getListApi: async (params: any) => {
    let [
      { data: metaSettingData },
      { data: documentTypeProfileList },
      { data: metaMappingList }
    ]: any = await Promise.all([
      newAdminApi.getDmsSettingSystem(''),
      newAdminApi.getDocpalWorkflowQuerydocumenttypeprofile(),
      newAdminApi.getDocpalWorkflowQuerymetadatamapping()
    ])
    allMetaSetting.value = metaSettingData
    console.log('response', metaSettingData, documentTypeProfileList, metaMappingList)
    const metaList: any[] = []

    metaMappingList.forEach((item: any) => {
      if (!!item.metaDataMapper) {
        if (metaSettingData[item.name]) {
          metaSettingData[item.name].mappingMeta = JSON.parse(item.metaDataMapper)
        }
      }
    })
    documentTypeProfileList.forEach((item: any) => {
      if (item.profileName) {
        if (metaSettingData[item.documentType]) {
          if (!metaSettingData[item.documentType].bulkImportConfigs) {
            metaSettingData[item.documentType].bulkImportConfigs = []
          }
          metaSettingData[item.documentType].bulkImportConfigs.push(item.profileName)
        }
      }
    })
    Object.keys(metaSettingData).forEach(key => {
      metaList.push({ ...metaSettingData[key], documentType: key })
    })
    const response = metaList.sort((a, b) => (a.documentType.localeCompare(b.documentType)))
    allMetaList.value = response
    //TODO : handle sort local
    return response

  },
  handelDblclick: (row: any) => {
    const newItem = newBulkImportDetail(row)
    routerProvider?.navigateTo(newItem)
  },
  handelDelete: async (row: any) => {
    ElMessageBox.confirm(
      `${t('bulkImport_deleteMsg', { name: row.documentType })}`,
      {
        confirmButtonClass: 'el-button el-button--warning',
        dangerouslyUseHTMLString: true,
        confirmButtonText: t('common_confirmDelete')
      }
    ).then(async () => {

      const newMetaList = { ...allMetaSetting.value }
      delete newMetaList[row.documentType]
      await newAdminApi.putDmsSettingSystemSystemid('', newMetaList)
      routerProvider?.message.success(t('tip_deleteSuccessMsg', {
        modelName: t('bulkImport_bulkImportForDocumentType'),
        name: row.documentType
      }))
      // TODO : show pop confirm to remove
      tableRef.value?.reload()
    })
  },
  permissionMethod: (args: PermissionMethodParams) => {
    if (!args.row) {
      return { visible: false, disabled: false }
    }
    return { visible: true, disabled: false }
  }
})

</script>


<template>
  <div class="pageContainer--padding">
    <BulkImportListTable ref="tableRef">
      <template #toolbar_buttons>
        <!--                <KeywordFilter attr="documentType"></KeywordFilter>-->
        <el-button id="BulkImport__CreateNewBulkImport" class="button-add" type="primary" @click="handleAdd()">
          {{ $t('bulkImport_create') }}
        </el-button>
      </template>
    </BulkImportListTable>
    <BulkImportAddDocTypeDialog ref="MetaAddDocTypeDialogRef" :metaSettingData="allMetaSetting"
                                @refresh="tableRef.value?.reload()"></BulkImportAddDocTypeDialog>
  </div>
</template>

<style lang="scss" scoped>
:deep(.vxe-buttons--wrapper) {
  display: flex;
  justify-content: space-between;
  flex-direction: row-reverse;
}

</style>

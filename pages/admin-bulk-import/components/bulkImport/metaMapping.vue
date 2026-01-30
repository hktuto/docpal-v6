<template>
  <div>
    <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
      <template #toolbar_buttons>
        <div class="tableHeaderRow">
          <span>{{ $t('docType_metaMapping') }}</span>
          <el-button id="BulkImport__Meta__AddNewDisplayMeta" class="button" type="primary"
                     @click="handleDialogShow()">{{ $t('docType_addDisplayMeta') }}
          </el-button>
        </div>
      </template>
    </VxeGrid>
    <BulkImportMetaMappingDialog ref="BulkImportMetaMappingDialogRef" :docType="docType"
                                 :metaMapping="state.metaMapping"
                                 @refresh="updateSuccess"></BulkImportMetaMappingDialog>
  </div>
</template>


<script lang="ts" setup>
import { ElMessageBox } from 'element-plus'
import { newAdminApi } from 'api'

const { name, docType } = defineProps<{
  docType: object,
  name: string
}>()
const state = reactive<{
  list: any[],
  _list: any[],
  metaMapping: any
}>({
  list: [],
  _list: [],
  metaMapping: {}
})

const { t } = useI18n()


const { tableConfig, tableEvent, tableRef, reload } = useVxeTable({
  id: 'admin-bulk-import-meta',
  api: async (params: any) => {
    const data = await newAdminApi.getAdmindocpalWorkflowQuerymetadatamapping({ name }).then(res => res.data || []).catch((err) => ([])) as any

    state.metaMapping = { ...data[0] }
    state.metaMapping.metaDataMapper = data[0].metaDataMapper ? JSON.parse(data[0].metaDataMapper) : {}
    state.list = data.reduce((prev: any, item: any) => {
      if (item.metaDataMapper) {
        const _metaDataMapper = JSON.parse(item.metaDataMapper)
        Object.keys(_metaDataMapper).forEach(key => {
          prev.push({ metaData: key, label: _metaDataMapper[key] })
        })
      }
      return prev
    }, [])
    return deepCopy(state.list)
  },
  virtualScroll: true,
  columns: [
    {
      field: 'metaData',
      title: 'docType_property'
    },
    {
      field: 'label',
      title: 'docType_label'
    }
  ],
  bodyActions: [
    [
      {
        name: 'common_edit',
        action: ({ row }: any) => handleDialogShow(row)
      },
      {
        name: 'common_delete',
        action: ({ row }: any) => handleDelete(row)
      }
    ]
  ],
  dblClickAction: ({ row }: any) => handleDialogShow(row),
  permissionMethod: (args: PermissionMethodParams) => {
    if (!args.row) {
      return { visible: false, disabled: false }
    }

    return { visible: true, disabled: false }
  }
})

async function handleDelete(row: any) {
  ElMessageBox.confirm(`${t('msg_confirmWhetherToDelete')}`)
    .then(async () => {
      const _metaMapping = {
        name: state.metaMapping.name,
        metaDataMapper: { ...state.metaMapping.metaDataMapper }
      }
      delete _metaMapping.metaDataMapper[row.metaData]
      await newAdminApi.postAdmindocpalWorkflowSavemetadatamapping({
        documentType: [_metaMapping]
      })
      reload()
    })

}

const BulkImportMetaMappingDialogRef = ref()

function handleDialogShow(data?: any) {
  BulkImportMetaMappingDialogRef.value.handleOpen(state.list, data)
}

function updateSuccess() {
  reload()
}

</script>

<style lang="scss" scoped>
.card {
  height: 100%;
  overflow: hidden;
  position: relative;
}

.tableHeaderRow {
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-start;
  align-items: center;
  gap: var(--app-space-xs);
}
</style>
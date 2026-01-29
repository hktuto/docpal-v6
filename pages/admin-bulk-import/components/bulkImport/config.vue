<script lang="ts" setup>
import { useVxeTable } from '#imports'
import { ElMessageBox } from 'element-plus'
import { clientApi } from 'api'
const routerProvider = inject(MenuRouterKey)
const { name } = defineProps<{
  name: string
}>()
const state = reactive({
  list: [],
  _list: []
})
const { t } = useI18n()

function newSuccess() {
  routerProvider?.message.success(`${t('msg_success')}`)
  reload()
}

const { tableConfig, tableEvent, tableRef, reload } = useVxeTable({
  id: 'admin-bulk-import-config',
  api: async () => {
    try {
      const { data } = await clientApi.admin.getAdmindocpalWorkflowQuerydocumenttypeprofileid({ documentType: name }) as any
      console.log('data on config', data)

      return data
    } catch (e) {
      return []
    }
  },
  virtualScroll: true,
  columns: [
    {
      field: 'id',
      title: 'dpTable_id'
    },
    {
      field: 'profileName',
      title: 'dpTable_name'
    }
  ],
  bodyActions: [
    [
      {
        name: 'delete',
        actions: async (row: any, rowIndex: number) => {
          handleDelete(row)
        }
      }
    ]
  ]
})


async function handleDelete(row: any) {
  ElMessageBox.confirm(`${t('msg_confirmWhetherToDelete')}`)
    .then(async () => {
      try {
        await adminApi.api.deleteWorkflowDeletedocumenttypeprofile(row.profileID)
      } catch (error) {
      }
      reload()
    })
}

const BulkImportConfigDialogRef = ref()

function handleDialogShow(row?: any) {
  const data = row ? deepCopy(row) : ''
  BulkImportConfigDialogRef.value.handleOpen(data)
}

onMounted(() => {
  reload()
//     getTable()
})


</script>

<template>
  <div class="card">
    <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
      <template #toolbar_buttons>
        <div class="tableHeaderRow">
          <span>{{ $t('docType_captureProfile') }}</span>
          <el-button id="BulkImport__Profile__AddNewCaptureProfile" class="button" type="primary"
                     @click="handleDialogShow()">
            {{ $t('bulkImport_detailAddCaptureProfile') }}
          </el-button>
        </div>
      </template>
    </VxeGrid>

    <BulkImportConfigDialog :name="name" ref="BulkImportConfigDialogRef" @refresh="newSuccess"></BulkImportConfigDialog>
  </div>
</template>


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
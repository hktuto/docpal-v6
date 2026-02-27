<script lang="ts" setup>
import { MessageTemplateProviderKey, newMessageTemplateDetailPageRoute, newMessageTemplateTemplatePageRoute } from '~/utils/messageTemplateHelper'
import { newAdminApi } from 'api'
import { ElMessageBox } from 'element-plus'

const { t } = useI18n()
const routerProvider = inject(MenuRouterKey)
const ResponsiveFilterRef = ref()
const tableRef = ref()
const newTemplateRef = ref()
const duplicateTemplateRef = ref()

function itemReload() {
  if (tableRef.value) {
    tableRef.value.reload()
  }
}

function handleFilterFormChange(formModel: any) {
  if (!formModel.isDesc) formModel.isDesc = true
  if (!!formModel.isDesc) formModel.isDesc = formModel.isDesc !== 'false'
  tableRef.value.handleFilterFormChange(formModel)
  itemReload()
}

provide(MessageTemplateProviderKey, {
  getListApi: (params: any) => newAdminApi.postDocpalMessageTemplateList(params),
  openDetail: (row: any) => {
    const tabItem = newMessageTemplateDetailPageRoute(row)
    routerProvider?.navigateTo(tabItem)
  },
  openTemplate: (row: any) => {
    const tabItem = newMessageTemplateTemplatePageRoute(row)
    routerProvider?.navigateTo(tabItem)
  },
  duplicate: (row: any) => {
    // open duplicate dialog
    duplicateTemplateRef.value?.open(row)
  },
  delete: async (row: any) => {
    // call delete api
    // deleteDialogRef.value?.open(row)
    try {
      let action = await ElMessageBox.confirm(t('tip_deleteMsg', { modelName: t('adminMenu.messageTemplate'), name: null }), {
        confirmButtonClass: 'el-button el-button--warning',
        confirmButtonText: t('common_confirmDelete')
      })
      if (action !== 'confirm') return
      await newAdminApi.deleteDocpalMessageTemplateId(row.id)
      routerProvider?.message.success(t('vxe.grid.delSuccess'))
      itemReload()
    } catch (error) {
      console.log(error)
    }
  }
})

function getFilter() {
  const data = [
    {
      key: 'orderBy',
      label: 'tableHeader.sortBy',
      type: 'string',
      isMultiple: false,
      options: [
        { label: 'role.creator', value: 'createdBy' },
        { label: 'userSetting_language', value: 'language' },
        { label: 'workflow_editorLastModified', value: 'modifiedBy' },
        { label: 'table_last_update', value: 'modifiedDate' },
        { label: 'message_templateName', value: 'templateName' },
        { label: 'message_templateStatus', value: 'whatsAppStatus' }
        // { label: 'message_templateUsage', value: 'usages' }
      ]
    },
    {
      key: 'isDesc',
      label: 'tableHeader.sortOrder',
      type: 'string',
      isMultiple: false,
      options: [
        { label: 'tableHeader.asc', value: false },
        { label: 'tableHeader.desc', value: true }
      ]
    }
  ]
  ResponsiveFilterRef.value.init(data)
}

onMounted(() => {
  getFilter()
})
</script>

<template>
  <div class="pageContainer">
    <MessageTemplateTable ref="tableRef">
      <template #toolbar_buttons>
        <div class="actions">
          <ResponsiveFilter ref="ResponsiveFilterRef" @form-change="handleFilterFormChange" />
          <ElButton id="MessageTemplate_NewTemplate" type="primary" @click="newTemplateRef.open()">
            {{ $t('messageTemplate_Create') }}
          </ElButton>
        </div>
      </template>
    </MessageTemplateTable>
    <MessageTemplateNewDialog ref="newTemplateRef" @success="itemReload" />
    <MessageTemplateDuplicateDialog ref="duplicateTemplateRef" @success="itemReload" />
  </div>
</template>

<style lang="scss" scoped>
.pageContainer {
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
  padding: var(--app-space-xs);
}

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

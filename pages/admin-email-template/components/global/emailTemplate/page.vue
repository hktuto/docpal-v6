<template>
  <div class="pageContainer--padding">
    <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
      <template #toolbar_buttons>
        <ResponsiveFilter ref="ResponsiveFilterRef" inputKey="name" @form-change="handleFilterFormChange" inputPlaceHolder="emailContentTemplate_filter" />
      </template>
      <template #toolbarTools>
        <el-button id="EmailContentTemplate__EditEmailLayout" type="info" @click="handleEditEmailLayout">
          {{ $t('button.editEmailLayout') }}
        </el-button>
        <el-button id="EmailContentTemplate__CreateNewEmailTemplate" type="primary" @click="handleAdd">
          {{ $t('emailContentTemplate_create') }}
        </el-button>
      </template>
      <template #status="{ row }">
        <el-tag v-if="row.enable" type="success">{{ $t('actions.activated') }}</el-tag>
        <el-tag v-else type="danger">{{ $t('actions.inactive') }}</el-tag>
      </template>
    </VxeGrid>
  </div>
</template>
<script lang="ts" setup>
import { ElMessageBox } from 'element-plus'
import { newAdminApi } from 'api'
import { routeEmailTemplateDetail, routeLayoutTemplatePage } from '~/utils/routerHelper'

const routerProvider = inject(MenuRouterKey)
if (!routerProvider) {
  throw new Error('MenuRouterKey is not provided')
}
const { t } = useI18n()
let extraParams: any = {}
const { tableConfig, tableEvent, tableRef, query, reload, cleanSelectedRows } = useVxeTable({
  id: 'a-emailTemplate',
  customeToolBar: true,
  api: (pageParams: any) => newAdminApi.postDmsTemplateEmailTemplatePage({ ...pageParams, ...extraParams }),
  columns: [
    { field: 'label', title: 'emailContentTemplate_name', fixed: 'left' },
    { field: 'subject', title: 'tableHeader_subject' },
    { field: 'id', title: 'emailContentTemplate_id' },
    { field: 'emailLayoutName', title: 'emailContentTemplate_layoutUsed' },
    { field: 'createdBy', title: 'emailContentTemplate_creator' }
  ],
  dblClickAction: ({ row, column, event }: any) => {
    handleDblclick(row)
  },
  bodyActions: [
    [
      {
        code: 'edit',
        name: t('emailContentTemplate_edit'),
        visible: true,
        disabled: false,
        action: ({ row }: any) => {
          handleDblclick(row)
        }
      },
      {
        code: 'delete',
        name: t('emailContentTemplate_delete'),
        visible: true,
        disabled: false,
        action: ({ row }: any) => {
          handleDeleteTemplate(row)
        }
      }
    ]
  ]
})

function handleDblclick(row) {
  // router.push(`/easyFormManage/${row.id}`);
  routerProvider?.navigateTo(routeEmailTemplateDetail(row), false)
}

function handleAdd() {
  routerProvider?.navigateTo(
    routeEmailTemplateDetail({
      label: 'new',
      id: 'new'
    }),
    false
  )
}

interface Template {
  id: string
  name: string
}

async function handleDeleteTemplate(row: Template[]) {
  try {
    const action = await ElMessageBox.confirm(t('tip_deleteMsg', { modelName: t('Email.fields'), name: row.label }), {
      confirmButtonClass: 'el-button el-button--warning',
      confirmButtonText: t('common_confirmDelete')
    })
    if (action !== 'confirm') return
    await newAdminApi.deleteDmsTemplateEmailTemplateId(row.id)
    routerProvider?.message.success(t('tip_deleteSuccessMessage', { name: row.label }))
    query({})
  } catch (error) {
    console.log(error)
  }
}

function handleFilterFormChange(formModel: any) {
  if (!formModel.isDesc) formModel.isDesc = true
  if (!!formModel.isDesc) formModel.isDesc = formModel.isDesc !== 'false'
  extraParams = formModel
  reload()
}

const ResponsiveFilterRef = ref()

async function getFilter() {
  const layouts = await newAdminApi.getDmsTemplateEmailLayoutAll().then((res) => res.data)
  const filters = [
    {
      key: 'orderBy',
      label: 'tableHeader.sortBy',
      type: 'string',
      isMultiple: false,
      options: [
        { label: 'emailContentTemplate_creator', value: 'createdBy' },
        { label: 'emailContentTemplate_id', value: 'id' },
        { label: 'emailContentTemplate_name', value: 'label' },
        { label: 'tableHeader_subject', value: 'subject' }
        // { label: 'emailContentTemplate_layoutUsed', value: 'emailLayoutName' },
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
    },
    {
      key: 'emailLayoutIds',
      label: 'emailContentTemplate_layoutUsed',
      type: 'string',
      options: layouts?.map((item) => ({
        value: item.id,
        label: item.name
      }))
    }
  ]
  ResponsiveFilterRef.value.init(filters)
}

function handleEditEmailLayout() {
  routerProvider?.navigateTo(routeLayoutTemplatePage(), false)
}

onMounted(() => {
  getFilter()
})
</script>
<style lang="scss" scoped>
:deep(.el-input) {
  width: 200px;
}
</style>

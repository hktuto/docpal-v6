<script setup lang="ts">
import json from './testWorkflow.json'
import { newAdminApi } from 'api'

const workflowEditorRef = ref()
const openDialog = ref(false)
const openWorkflowEdit = ref(false)
const workflowData = ref<any>()
const workflowReadonly = ref<boolean>(true)
const form = ref({
  name: ''
})

const { tableConfig, tableEvent, tableRef, query, reload } = useVxeTable({
  id: 'admin-workflow-manage',
  api: async (pageParams: any) => {
    const params = {
      page_size: pageParams.pageSize,
      page_num: pageParams.pageNum
    }
    return await getData(params)
  },
  columns: [
    { field: 'key', title: 'Workflow Key', fixed: 'left' },
    { field: 'name', title: 'workflow_workflowName' },
    { field: 'draft_content.description', title: 'Description' },
    {
      field: 'created_at',
      title: 'Create Date',
      formatter({ cellValue }: any) {
        return formatDate(cellValue)
      }
    }
  ],
  bodyActions: [],
  selectChangeHander: (selectedRows: any[]) => {},
  dblClickAction: ({ row, column, event }: any) => {
    handleReallocate(row)
  }
})

async function getData(params: any) {
  const data = await $api.post('http://192.168.5.147:8080/api/v1/workflow/definitions/page', params).then((r) => r.data)
  // tableRef.value?.loadData(data.items)
  return {
    data:{
      entryList: data.items,
      totalSize: data.total,
    },
  }
}
const router = useRouter()
function handleReallocate(row) {
  try {
    openWorkflowEdit.value = true
    router.push({
      path: '/new page path',
    })
    return
    workflowData.value = row.draft_content
    console.log(123, workflowData.value)
    workflowReadonly.value = row.status !== 'D'
    nextTick(() => {
      workflowEditorRef.value?.init()
    })
  } catch (e) {
    console.log(e)
  }
}

async function handleSubmit() {
  const defWorkflowJson = {
    ...json,
    key: `${form.value.name}_${Date.now()}`,
    name: form.value.name
  }
  try {
    const data = $api.post('http://192.168.5.147:8080/api/v1/workflow/definitions', defWorkflowJson).then((res) => res.data)
    if (!data) {
      workflowData.value = data
      openWorkflowEdit.value = true
      nextTick(() => {
        workflowEditorRef.value?.init()
      })
    }
  } catch (e) {
    console.log(e)
  }
  openDialog.value = false
}
</script>

<template>
  <div style="height: 300px">
    <div class="pageContainer--padding">
      <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
        <template #toolbar_buttons>
          <el-button @click="openDialog = true">Create Workflow</el-button>
          <!--        <ResponsiveFilter ref="ResponsiveFilterRef" @form-change="handleFilterFormChange" />-->
          <!--        <el-button
            :loading="state.loading"
            id="ActiveWorkflowManagement__Delete"
            v-show="state.selectedRows.length > 0"
            type="danger"
            @click="handleDeleteSelected()"
          >
            {{ $t('common_delete') }}
          </el-button>-->
        </template>
      </VxeGrid>
    </div>
  </div>

  <div style="height: 500px;">
    <div v-if="openWorkflowEdit" class="pageContainer">
      <LazyWorkflowEditor ref="workflowEditorRef" :workflow-data="workflowData" :readonly="workflowReadonly" />
    </div>
  </div>

  <el-dialog title="Create Workflow" v-model="openDialog">
    <el-form label-position="top">
      <el-form-item label="Workflow Name">
        <el-input v-model="form.name" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button type="primary" @click="handleSubmit">Submit</el-button>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
.pageContainer {
  width: 100%;
  height: 100%;
}
</style>

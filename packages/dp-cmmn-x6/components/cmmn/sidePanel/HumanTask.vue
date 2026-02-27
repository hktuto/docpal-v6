<script lang="ts" setup>
import { updateExtentionProperties, getExtentionProperties } from '../../../utils/cmmnConfig'

const props = defineProps(['graph', 'node'])
import { newClientApi } from 'api'

const { node } = toRefs(props)
const { caseId } = useCmmnGraph()
const caseProvider = inject(CaseManagementEditorKey)
const state = reactive<any>({
  data: [],
  activeName: 'field',
  isStartTask: false
})
const dragHeader = [
  { name: 'name', label: $i18n.t('docType_label') },
  { name: 'type', label: $i18n.t('type'), i18n: 'marsterTable.type.' }
]

function handleSave() {
  const nodeData = node.value.data
  const data = updateExtentionProperties(nodeData.data, 'docpal:form', state.data, caseId.value)
  return state.data
}

function handleSaveStartTask() {
  const cmmnDefaultProps = {
    value: state.isStartTask
  }
  const nodeData = node.value.data
  const data = updateExtentionProperties(nodeData.data, 'docpal:isStartingTask', cmmnDefaultProps, caseId.value)
}

function init(nodeData: any) {
  state.data = getExtentionProperties(nodeData.data, 'docpal:form')
  const isStartingTask = getExtentionProperties(nodeData.data, 'docpal:isStartingTask')

  state.isStartTask = isStartingTask && isStartingTask[0] && isStartingTask[0].value
}

const formDialogVisible = ref(false)
const fromDesignRef = ref()
const fieldListApi = computed(() => {
  return {
    labelKey: 'attr_name',
    nameKey: 'attr_id',
    data: caseProvider.allInfo.value
  }
})

async function formSubmit() {

  const json = fromDesignRef.value.getFormJson()
  await newClientApi.postDmsFormPropertiesSave({
    processKey: caseId.value,
    userTaskId: node.value.data.data.attr_id,
    jsonValue: JSON.stringify(json),
    versionId: caseProvider.versionId.value
  })
  formDialogVisible.value = false
}

async function editForm() {

  // formDialog.value.handleOpen(state.data)
  // console.log("editForm", caseId.value, node.value.data.data.attr_id, caseProvider.versionId.value)
  const response = await newClientApi.getDmsFormPropertiesQuery({
    processKey: caseId.value,
    userTaskId: node.value.data.data.attr_id,
    versionId: caseProvider.versionId.value
  })
  if (!response || !response.data) {
    throw createError('Server Error')
  }
  formDialogVisible.value = true
  setTimeout(() => {
    if (!response || !response.data) return
    if (response?.data.length > 0) {
      const json = JSON.parse(response.data[0].jsonValue || '{}')
      fromDesignRef.value.setFormJson(json)
    } else {
      fromDesignRef.value.setFormJson({})
    }
  })
}

watch(node, () => {
  if (node.value) {
    init(node.value.data)
  }
}, {
  immediate: true,
  deep: true
})
</script>

<template>
  <div class="cmmnSidebarItemContainer">
    <CmmnSidePanelUiHeader title="Human Task" />
    <CmmnSidePanelUiLabel :node="node" />
    <CmmnSidePanelUiItemControl :node="node" />
    <CmmnSidePanelUiIsStartTask v-model="state.isStartTask" @change="handleSaveStartTask" />
    <CmmnSidePanelUiAssignee :node="node" :graph="graph" />
    <ElDivider />
    <ElButton type="primary" @click="editForm">Edit Form</ElButton>
    <!-- TODO : human task form is remove from this panel -->
    <!-- <el-tabs v-model="state.activeName" @tab-click="handleClick">
        <el-tab-pane :label="$t('workflowEdior.formField')" name="field">
            <CmmnSidePanelDraggable :list="state.data" :graph="graph"
                :dragHeader="dragHeader"
                formJsonUrl="humanTaskFields"
                @change="handleSave">
            </CmmnSidePanelDraggable>
        </el-tab-pane>
    </el-tabs> -->


    <ElDialog v-model="formDialogVisible" fullscreen class="bpmn-vform--dialog" width="100%" top="0" append-to-body
              destroy-on-close>
      <FormDesigner ref="fromDesignRef" :fieldListApi="fieldListApi">
        <template #submit>
          <ElButton type="primary" @click="formSubmit">{{ $t('submit') }}</ElButton>
        </template>
      </FormDesigner>
    </ElDialog>
  </div>
</template>

<style lang="scss">
.bpmn-vform--dialog {
  overflow: hidden !important;
  display: grid;
  grid-template-rows: min-content 1fr;

  .el-dialog__body {
    overflow: hidden;
  }

  .center-layout-container {
    .el-main {
      overflow: hidden;

      .el-scrollbar {
        height: 100% !important;
      }
    }
  }

  .el-aside {
    .el-tabs {
      height: 100%;
      overflow: hidden;

      .el-tabs__content {
        overflow: auto;
      }
    }
  }
}
</style>

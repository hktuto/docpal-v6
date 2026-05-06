<script lang="ts" setup>
import type { Node } from '@antv/x6'
import { createError } from '#imports'

const { node } = defineProps<{
  node: Node
}>()

const graphProvider = inject(WORKFLOW_EDITOR_PROVIDER)
if (!graphProvider) {
  throw createError('graph provider not found')
}

const allDocumentStep = computed(() => {
  return []
  // return (
  //   graphProvider.graph.value
  //     ?.getNodes()
  //     .filter((element: any) => {
  //       const nodeData = element.getData()
  //       if (!nodeData.data || !nodeData.data['attr_flowable:delegateExpression']) {
  //         return false
  //       }
  //       return nodeData.data['attr_flowable:delegateExpression'] === '${generateDocumentDelegate}'
  //     })
  //     .map((element) => ({ value: element.data.data.attr_id, label: element.data.data.attr_name })) || []
  // )
})

const defaultForm: Form = {
  attr_documentStepId: '',
  attr_previewButtonText: 'Preview'
}

type Form = {
  attr_documentStepId: string
  attr_previewButtonText: string
}

const form = ref<Form[]>([])

function addButton() {
  form.value.push({
    ...defaultForm
  })
}

function setForm() {
  const nodeData = node.getData()

  // TODO: set to metadata
  const newData = {
    ...nodeData,
    version: nodeData.version + 1 || 1,
    metadata: {
      ...nodeData.metadata
    }
  }
  node.setData(newData, {
    deep: true,
    overwrite: true
  })
}

function getForm() {
  const nodeData = node.getData()
  // if (nodeData.data && nodeData.data.extensionElements && nodeData.data.extensionElements['docpal:previewDocumentButton']) {
  //   if (!Array.isArray(nodeData.data.extensionElements['docpal:previewDocumentButton'])) {
  //     form.value = [nodeData.data.extensionElements['docpal:previewDocumentButton']]
  //   } else {
  //     form.value = nodeData.data.extensionElements['docpal:previewDocumentButton']
  //   }
  // } else {
  form.value = []
  // }
}

onMounted(() => {
  useWorkflowAdditionalContext(getForm)
})

watch(
  form,
  () => {
    setForm()
  },
  {
    deep: true
  }
)
</script>

<template>
  <div class="formContainer">
    <h4>Preview Document</h4>
    <!--    <template v-if="allDocumentStep.length === 0">No Document Generate step found</template>-->
    <!--    <div v-else class="listContainer">-->
    <!--      <template v-for="(item, index) in form">-->
    <!--        <ElForm :model="item" label-position="top" class="listItem">-->
    <!--          <ElFormItem label="Document">-->
    <!--            <ElSelect v-model="item.attr_documentStepId" placeholder="Document Step" filterable>-->
    <!--              <ElOption v-for="item in allDocumentStep" :key="item.value" :label="item.label" :value="item.value" />-->
    <!--            </ElSelect>-->
    <!--          </ElFormItem>-->
    <!--          <ElFormItem label="Button Text">-->
    <!--            <ElInput v-model="item.attr_previewButtonText" placeholder="Button Text" />-->
    <!--          </ElFormItem>-->
    <!--          <ElFormItem>-->
    <!--            <ElButton text @click="form.splice(index, 1)">Remove</ElButton>-->
    <!--          </ElFormItem>-->
    <!--        </ElForm>-->
    <!--      </template>-->
    <!--      <div class="actions">-->
    <!--        <ElButton text @click="addButton">Add</ElButton>-->
    <!--      </div>-->
    <!--    </div>-->
  </div>
</template>

<style lang="scss" scoped>
.listContainer {
  display: flex;
  flex-direction: column;
  gap: 10px;
  .listItem {
    width: 100%;
    padding: var(--app-space-s);
    border: 1px solid var(--app-grey-800);
    border-radius: var(--app-border-radius-m);
  }
  .actions {
    border-top: 1px solid var(--app-grey-800);
    padding-block: var(--app-space-s);
    display: flex;
    justify-content: center;
    gap: 10px;
  }
}
</style>

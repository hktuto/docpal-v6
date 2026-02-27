<template>
  <el-form ref="FormRef" label-position="top" :model="form" @submit.prevent>
    <el-formItem
      :label="$t('workflow_assignee')"
      prop="assignee"
      :rules="[{ required: true, message: $t('workflow_assignee') + $t('render.hint.fieldRequired') }]"
    >
      <el-select 
        v-model="form.assignee"
        :disabled="disabled" filterable allow-create
        placeholder="assignee"
        @change="handleChange"
      >
        <el-option v-for="item in state.options"  :label="item.label" :value="item.value" :key="item.value" />
      </el-select>
    </el-formItem>
  </el-form>
</template>
<script lang="ts" setup>
import { Graph, Node } from "@antv/x6";
import { newClientApi } from 'api'
const props = defineProps<{
  graph: Graph;
  node: Node;
  disabled: boolean;
}>();
const { node } = toRefs(props);
const { caseId } = useCmmnGraph();
const state = reactive<any>({
  options: []
})
const form = ref({
  assignee: "",
});
const FormRef = ref();
async function handleChange(newAssignee: string) {
  try {
    await FormRef.value.validate()
  } catch (e) {
    console.error(e)
    return
  }

  const nodeData = node.value.data
  nodeData.data['attr_flowable:assignee'] = newAssignee
}
async function getCaseInformation(graph) {
  const defaultOption = [
   { label: "Creator",
    value: "${creator}",}
  ]
  const group = await newClientApi.postUcenterGroups().then(r => r.data)
  console.log("group", group)
  defaultOption.push(...group.map((item) => ({
    label: item.name,
    value: item.id,
  })))
  state.options = defaultOption
  // try {
  //   const caseNode = graph.getCellById(caseId.value);
  //   const casePlanModel = caseNode.data.data.casePlanModel
  //     ? caseNode.data.data.casePlanModel
  //     : caseNode.data.data.data.casePlanModel;
  //   const field = casePlanModel.extensionElements["docpal:form"][0].field;
  //   state.options = field.map((item) => ({
  //     ...item,
  //     label: `$\{${item.attr_id}\}`,
  //     value: `$\{${item.attr_id}\}`,
  //   }));
  // } catch (error) {
  //   state.options = [];
  // } finally {
  //   state.options.push({
  //     label: '${initiator}',
  //     value: '${initiator}'
  //   })
  // }
}
onMounted(() => {
  getCaseInformation(props.graph)
})
watch(
  node,
  () => {
    if (node.value) {
      console.log(node.value);
      form.value.assignee =
        node.value.data.data["attr_flowable:assignee"] || "${creator}";
    }
  },
  {
    immediate: true,
  }
);
</script>
<style lang="scss" scoped></style>

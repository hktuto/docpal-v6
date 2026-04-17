<script lang="ts" setup>
import { useMDKanbanInject } from "../../../composables/mdKanban/useMDKanban"

const visible = ref(false);
const { viewStyleConfig, updateViewFilterSortGroup, columns } = useMDKanbanInject()
function open(setting: any) {
  visible.value = true;
  form.value = { ...viewStyleConfig.value, ...setting }
}

function close() {
  visible.value = false;
}

// Form Logic
// Form State
const form = ref({
  selectedColumnId:"",
  options: []
})
// columns fiter
const selectFilter = computed(() => {
  return columns.value.filter((column:any) => column.business_type.toString() === "3")
})

const selectedColumnDetail = computed(() => {
  return columns.value.find((column:any) => column.id === form.value.selectedColumnId)
})

async function submitSetting(){
  // check if selectedColumnId is valid
  console.log("form", form.value)
  form.value.options = selectedColumnDetail.value?.display_structure.options
  await updateViewFilterSortGroup?.('style', form.value)
  close()
}


defineExpose({
  open,
  close,
})
</script>


<template>
    <ElDialog
        v-model="visible"
        :close-on-press-escape="false"
        :close-on-click-modal="false"
        :show-close="false"
        >
            <ElForm :model="form" label-position="top">

                <ElFormItem v-if="selectFilter.length > 0" label="Column" >
                    <ElSelect v-model="form.selectedColumnId" placeholder="Select a column" clearable filterable>
                        <ElOption v-for="column in selectFilter" :key="column.id" :label="column.field_name_alias" :value="column.id"></ElOption>
                    </ElSelect>
                </ElFormItem>
                <ElFormItem v-else>
                    <p>No columns available</p>
                    <ElButton type="primary" @click="close">Create Select Column</ElButton>
                </ElFormItem>

                <ElFormItem>
                    <ElButton type="primary" @click="submitSetting">Save</ElButton>
                </ElFormItem>
            </ElForm>
    </ElDialog>
</template>

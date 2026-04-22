<script lang="ts" setup>
import { useMDKanbanInject } from "../../../composables/mdKanban/useMDKanban"
import {useTableViewsInject} from '../../../../dynamic-db/composables/table/useTableViews'
const visible = ref(false);
const { viewStyleConfig, updateViewFilterSortGroup, columns } = useMDKanbanInject()
const { deleteView, currentView, addField } = useTableViewsInject()
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
  return columns.value.find((column:any) => column.field_name === form.value.selectedColumnId)
})

async function submitSetting(){
  // check if selectedColumnId is valid
  form.value.options = selectedColumnDetail.value?.display_structure.options
  await updateViewFilterSortGroup?.('style', form.value)
  close()
}

async function deleteKanban() {
  await deleteView?.(currentView.value.id)
  close()
}

async function addDummyColumn() {
// create columns to table and set form
  const dummyColumns = [
    {
    "field_name": "New Field",
    "business_type": "3",
    "display_structure": {
      "options": [
        {
          "id": `opt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          "label": "pending",
          "color": "#9b59b6"
        },
        {
          "id": `opt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          "label": "in progress",
          "color": "#3498db"
        },
        {
          "id": `opt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          "label": "done",
          "color": "#1abc9c"
        }
      ]
    }
  }]
  await addField(dummyColumns)
  const selectColumn = columns.value.filter((col) => col.business_type === '3')
  if (selectColumn && selectColumn.length == 1) {
    // only one select column, auto selecte this column
    form.value.selectedColumnId = selectColumn[0].field_name
    submitSetting()
  }
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
                        <ElOption v-for="column in selectFilter" :key="column.field_name" :label="column.field_name_alias" :value="column.field_name"></ElOption>
                    </ElSelect>
                </ElFormItem>
                <div v-else>
                    <div>No columns available</div>
                    <ElButton type="primary" @click="addDummyColumn">Create Select Column</ElButton>
                    <ElButton type="primary" @click="deleteKanban">Remove View</ElButton>
                </div>

                <ElFormItem>
                    <ElButton v-if="selectFilter.length > 0" type="primary" @click="submitSetting">Save</ElButton>
                </ElFormItem>
            </ElForm>
    </ElDialog>
</template>

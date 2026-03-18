<script setup lang="ts">
import { QuestionFilled } from '@element-plus/icons-vue'

const { t } = useI18n()
const dialogVisible = ref()
const props = defineProps<{
  title: string
}>()
const emits = defineEmits(['update'])
const state = reactive({
  variables: []
})

function openDrawer(variables: any) {
  dialogVisible.value = true
  state.variables = deepCopy(variables)
}

function handleCreate() {
  state.variables.push({ key: '', value: '' })
}

function handleDelete(index: number) {
  state.variables.splice(index, 1)
}

function handleSubmit() {
  dialogVisible.value = false
  emits('update', state.variables)
}

defineExpose({ openDrawer })
</script>

<template>
  <el-dialog v-model="dialogVisible" :title="props.title" append-to-body>
    <div>
      <div style="display: flex; justify-content: flex-end; align-items: center;">
        <el-button type="primary" size="small" @click="handleCreate">
          {{ t('docTemplate.variable.addRow') }}
        </el-button>
      </div>
      <el-table :data="state.variables" style="width: 100%">
        <el-table-column :label="t('Key')" prop="key">
          <template #default="{ row, $index }">
            <el-input v-model="row.key"/>
          </template>
        </el-table-column>
        <el-table-column prop="value">
          <template #header>
            <div style="display: flex; ">
              {{ t('Value') }}
              <el-popover class="box-item" width="300" title="Info" content="You can set data through '${key}'"
                          placement="top">
                <template #reference>
                  <el-icon style="display: flex; align-items: center; margin-left: 8px;">
                    <QuestionFilled />
                  </el-icon>
                </template>
              </el-popover>
            </div>
          </template>
          <template #default="{ row, $index }">
            <el-input v-model="row.value" />
          </template>
        </el-table-column>
        <el-table-column align="right" :label="t('dpTable_actions')">
          <template #default="scope">
            <el-button size="small" type="danger" @click="handleDelete(scope.$index)">
              {{ t('common_delete') }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <el-button type="primary" @click="handleSubmit"> {{ t('common_submit') }}</el-button>
      </div>
    </template>
  </el-dialog>

</template>

<style scoped lang="scss">

</style>

<script setup lang="ts">
import { VariableTypeOptions, type VariableSelectItem } from '#imports'
import { VariableItemDisplayType } from '@packages/workflow/composables/useWorkflowVariables'

const editComponent = ref()
const visible = ref(false)
const emits = defineEmits(['update'])
const field = ref<VariableSelectItem>()

function open(row: VariableSelectItem) {
  visible.value = true
  field.value = row
  typeChanged(row.display_type)
}

function handleSubmit() {
  visible.value = false
  emits('update', field.value)
}

function typeChanged(displayType: string) {
  const options = VariableTypeOptions.reduce((acc: any, item: any) => {
    acc.push(...item.options)
    return acc
  }, [])
  const typeObject = options.find((item: any) => item.display_type === displayType)

  if (!!typeObject) {
    field.value = {
      id: field.value.id,
      name: field.value.name,
      type: (Object.entries(VariableItemDisplayType).find(([, arr]) => arr.includes(displayType))?.[0] as VariableItemType) || ('string' as VariableItemType),
      display_type: displayType,
      required: field.value.required,
      validation: typeObject.validation
    }
    editComponent.value = resolveComponent(typeObject.component)
  }
}

defineExpose({ open })
</script>

<template>
  <el-dialog v-model="visible" title="Field Detail" append-to-body class="big">
    <el-form label-position="top">
      <el-form-item label="ID">
        <el-input v-model="field.id" disabled />
      </el-form-item>
      <el-form-item label="Name">
        <el-input v-model="field.name" disabled />
      </el-form-item>
      <el-form-item label="Type" prop="type">
        <el-select v-model="field.display_type" placeholder="Select" @change="typeChanged">
          <el-option-group v-for="group in VariableTypeOptions" :key="group.group" :label="$t(group.group)">
            <el-option v-for="option in group.options" :key="option.display_type" :label="$t(option.label)" :value="option.display_type" />
          </el-option-group>
        </el-select>
      </el-form-item>
      <el-form-item label="Required">
        <el-switch v-model="field.required" disabled />
      </el-form-item>

      <el-divider />
      <component ref="comRef" v-if="editComponent" :is="editComponent" v-bind="field" :form="field" />
    </el-form>

    <template #footer>
      <el-button type="primary" @click="handleSubmit">
        {{ $t('common_submit') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss"></style>

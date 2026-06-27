<script setup lang="ts">
import { VariableTypeOptions, type VariableItem } from '#imports'
import { VariableItemDisplayType } from '@packages/workflow/composables/useWorkflowVariables'

const editComponent = ref()
const visible = ref(false)
const emits = defineEmits(['update'])
const field = ref<VariableItem>()

function open(row: VariableItem) {
  visible.value = true
  field.value = deepCopy(row)
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
    const filedData = {
      id: field.value.id,
      name: field.value.name,
      type: (Object.entries(VariableItemDisplayType).find(([, arr]) => arr.includes(displayType))?.[0] as VariableItemType) || ('string' as VariableItemType),
      display_type: displayType,
      default_value: field.value.default_value,
      required: field.value.required
    } as VariableItem

    switch (displayType) {
      case 'dateRange':
        filedData.minItems = 0
        filedData.items = {
          type: 'date',
          properties: {
            start: {
              id: field.value.items?.properties?.start?.id,
              name: 'Start Date',
              description: 'Start Date',
              type: 'date',
              display_type: 'date',
              required: true,
              validation: {
                pattern: 'YYYY-MM-DD hh:mm:ss'
              }
            },
            end: {
              id: field.value.items?.properties?.end?.id,
              name: 'End Date',
              description: 'End Date',
              type: 'date',
              display_type: 'date',
              required: true,
              validation: {
                pattern: 'YYYY-MM-DD hh:mm:ss'
              }
            }
          }
        }
        break
      case 'array':
        filedData.minItems = 0
        filedData.items = !!field.value.items ? field.value.items : { type: 'string', properties: {} }
        break
      case 'object':
        filedData.items = {
          type: 'object',
          properties: field.value?.items?.properties || {}
        }
        break
      default:
        filedData.validation = typeObject.validation
    }
    field.value = filedData
    editComponent.value = resolveComponent(typeObject.component)
  }
}

defineExpose({ open })
</script>

<template>
  <el-dialog v-model="visible" title="Field Detail" append-to-body destroy-on-close class="big">
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

<template>
  <el-dialog v-model="visible" :title="t('actions.duplicate')" class="scroll-dialog" append-to-body
             :close-on-click-modal="false" destroy-on-close>
    <el-form :model="formData" ref="elFormRef" label-position="top">
      <el-form-item :label="t('metadata.original_name')" required>
        <el-input v-model="originalName" disabled />
      </el-form-item>
      <el-form-item :label="t('table_name')" prop="name" required>
        <el-input v-model="formData.name" :placeholder="t('render.hint.fieldRequired', { name: t('table_name') })" />
      </el-form-item>
      <el-form-item :label="t('metadata.dataType')" required>
        <el-select v-model="selectedType" placeholder="Select" disabled>
          <el-option-group v-for="group in METADATA_OPTIONS" :key="group.group" :label="t(group.group)">
            <el-option v-for="option in group.options" :key="option.name" :label="t(option.name)"
                       :value="option.name" />
          </el-option-group>
        </el-select>
      </el-form-item>
      <!-- validationRuleSection -->
      <template v-if="selectedType && formData.validationRule && mapDataType[selectedType]">
        <el-form ref="ruleFormRef" :model="formData.validationRule" label-position="top">
          <component :is="mapDataType[selectedType]" ref="dataTypeRef" :form="formData.validationRule" />
        </el-form>
      </template>
      <!-- // mask options -->
      <h4>{{ t('meta.mask') }}</h4>
      <el-form-item :label="t('meta.mask_type')" required>
        <el-select v-model="formData.maskRule.maskType" placeholder="Select">
          <el-option v-for="option in MASK_OPTIONS" :key="option.value" :label="t(option.label)"
                     :value="option.value" />
        </el-select>
      </el-form-item>
      <el-form-item :label="t('meta.maskLength')" required>
        <el-input-number v-model="formData.maskRule.maskLength" :min="1" :max="24" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button type="primary" @click="handleDuplicate">{{ t('actions.duplicate') }}</el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { clientApi } from 'api'
import { ElMessage, type FormInstance } from 'element-plus'
import {
  METADATA_OPTIONS,
  MASK_OPTIONS,
  type MetadataOption
} from '../../../../../../packages/dp-datatype/utils/dataTypeHelper'
import { mapDataType, getDefaultByType } from '../../../../../../packages/dp-datatype/utils/globalDataTypeHelper'

const formData = ref<any>({
  name: '',
  validationRule: {},
  langs: {},
  maskRule: {
    maskType: 'MASK_ALL',
    maskLength: 10
  }
})

const emit = defineEmits(['reload'])
const visible = defineModel<boolean>('visible', { required: true })

const { t } = useI18n()

const selectedType = ref<MetadataOption['name']>('Text')
const originalName = ref('')
const elFormRef = ref<FormInstance>()
const ruleFormRef = ref<FormInstance>()
const dataTypeRef = ref<any>()

function open(data: any) {
  originalName.value = data.name
  if (data.validationRule && data.validationRule.validationRuleName === 'mastertable') {
    selectedType.value = 'MasterTable'
  } else if (data.validationRule && data.validationRule.validationRuleName === 'userRoleUserGroup') {
    selectedType.value = 'UserRoleUserGroup'
  }
  // Copy all settings from the original metadata
  else if (data.validationRule && data.validationRule.validationRuleName) {
    // Set the selected type based on the original validation rule
    selectedType.value = data.validationRule.validationRuleName.charAt(0).toUpperCase() + data.validationRule.validationRuleName.slice(1)
  } else {
    selectedType.value = 'Text'
    data.validationRule = getDefaultByType(selectedType.value)
  }
  // Ensure maskRule exists
  if (!data.maskRule || !data.maskRule.maskType) {
    data.maskRule = {
      maskType: 'MASK_ALL',
      maskLength: 10
    }
  }
  // Copy all data except the name
  formData.value = {
    ...data,
    name: '', // Clear the name so user can enter a new one
    id: data.id // Remove the ID since this will be a new record
  }

  setTimeout(() => {
    if (formData.value.validationRule.validationRuleName === 'mastertable') {
      dataTypeRef.value?.masterTableChange(formData.value.validationRule.masterTableName, true)
    } else if (formData.value.validationRule.validationRuleName === 'date') {
      dataTypeRef.value?.initData()
    }
  }, 1000)
  nextTick(() => {
    visible.value = true
  })
}

function close() {
  // clean the form
  elFormRef.value?.resetFields()
  formData.value.name = ''
  formData.value.validationRule = null
  formData.value.langs = {}
  formData.value.maskRule = {
    maskType: 'MASK_ALL',
    maskLength: 10
  }
  originalName.value = ''
  visible.value = false
}

async function handleDuplicate() {
  try {
    // validate the form
    if (elFormRef.value) {
      // step 1 validate the form
      const formValid = await elFormRef.value.validate()
      if (!formValid) {
        return
      }
      console.log('=====', ruleFormRef)
      // check if the validationRule is valid
      if (ruleFormRef.value) {
        const isValid = await ruleFormRef.value.validate()
        if (!isValid) {
          ElMessage.error(t('meta.validation_error'))
          return
        }
      }

      // step 3 check if the name is already exists
      const nameExists = await clientApi.admin.postAdmindmsMetadataPage({
        metadataName: formData.value.name,
        pageNum: 0,
        pageSize: 1
      }).then((res) => (res.data?.entryList?.length ?? 0) > 0)

      if (nameExists) {
        ElMessage.error(t('dpTip.exit', { name: formData.value.name }))
        return
      }
      // step 4 create the duplicated metadata
      const result = await clientApi.admin.postAdmindmsMetadataDuplicate(formData.value).then((res) => res.data)
      if (result) {
        ElMessage.success(t('metadata.duplicate_success'))
        close()
        setTimeout(() => {
          emit('reload')
        }, 100)
      } else {
        ElMessage.error(t('metadata.duplicate_error'))
      }
    }
  } catch (error) {
    console.log(error)
  }
}

defineExpose({
  open,
  close
})
</script>

<style lang="scss" scoped></style>

<template>
  <el-dialog v-model="visible" :title="t('metadata.edit')" class="scroll-dialog" append-to-body
             :close-on-click-modal="false" destroy-on-close>
    <el-form :model="formData" ref="elFormRef" label-position="top">
      <el-form-item :label="t('table_name')" prop="name" required>
        <el-input v-model="formData.name" />
      </el-form-item>
      <el-form-item :label="t('metadata.dataType')" required>
        <el-select v-model="selectedType" placeholder="Select" @change="handleTypeChanged">
          <el-option-group v-for="group in METADATA_OPTIONS" :key="group.group" :label="t(group.group)">
            <el-option v-for="option in group.options" :key="option.name" :label="t(option.name)"
                       :value="option.name" />
          </el-option-group>
        </el-select>
      </el-form-item>
      <!-- validationRuleSection -->
      <!-- <MetadataValidatorUserRoleUserGroup v-model:validation="formData.validationRule" /> -->
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
      <el-button id="DocumentType__CreateNewDocumentType__Edit__Save" type="primary" @click="handleUpdate"
                 :loading="loading">{{ t('common_save') }}
      </el-button>
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
const loading = ref(false)

function open(data: any) {
  originalName.value = data.name
  // check if data.validationRUle is exist, if not, set the default value
  if (!data.validationRule || !data.validationRule.validationRuleName) {
    selectedType.value = 'Text'
    data.validationRule = getDefaultByType(selectedType.value)
  } else if (data.validationRule.validationRuleName === 'mastertable') {
    selectedType.value = 'MasterTable'
  } else if (data.validationRule.validationRuleName === 'user_role_user_group') {
    selectedType.value = 'UserRoleUserGroup'
  } else {
    // data.validationRule.type maybe in lower case, change it to first letter uppercase
    selectedType.value = data.validationRule.validationRuleName.charAt(0).toUpperCase() + data.validationRule.validationRuleName.slice(1)
  }
  if (!data.maskRule) {
    data.maskRule = {
      maskType: 'MASK_ALL',
      maskLength: 10
    }
  }
  formData.value = JSON.parse(JSON.stringify(data))
  nextTick(() => {
    visible.value = true
  })
  setTimeout(() => {
    if (formData.value.validationRule.validationRuleName === 'mastertable') {
      dataTypeRef.value?.masterTableChange(formData.value.validationRule.masterTableName, true)
    } else if (formData.value.validationRule.validationRuleName === 'date') {
      dataTypeRef.value?.initData()
    }
  }, 1000)
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
  visible.value = false
  setTimeout(() => {
    emit('reload')
  }, 1000)
}

async function handleUpdate() {
  // validate the form
  try {
    loading.value = true
    if (elFormRef.value) {
      // step 1 validate the form
      const formValid = await elFormRef.value.validate()
      if (!formValid) {
        return
      }
      // check if the validationRule is valid
      if (ruleFormRef.value) {
        const isValid = await ruleFormRef.value.validate()
        if (!isValid) {
          ElMessage.error(t('meta.validation_error'))
          return
        }
      }
      await clientApi.admin.patchAdmindmsMetadata(formData.value).then((res) => res.data)

      ElMessage.success(t('tip_updateMsg', { modelName: null, name: formData.value.name }))
      close()
    }
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

function handleTypeChanged(value: string) {
  formData.value.validationRule = getDefaultByType(value)
}

defineExpose({
  open,
  close
})
</script>

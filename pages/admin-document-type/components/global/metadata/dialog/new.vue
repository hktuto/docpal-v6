<template>
  <el-dialog v-model="visible" :title="t('metadata.new')" class="scroll-dialog" append-to-body
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
      <template v-if="selectedType && mapDataType[selectedType]">
        <el-form ref="ruleFormRef" :model="formData.validationRule" label-position="top">
          <component :is="mapDataType[selectedType]" :form="formData.validationRule" />
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
      <el-button id="DocumentType__CreateNewDocumentType__Create__NewMetadata" :loading="loading" type="primary"
                 @click="handleCreate">
        {{ $t('submit') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { ElMessage, type FormInstance } from 'element-plus'
import { newAdminApi } from 'api'
import {
  METADATA_OPTIONS,
  MASK_OPTIONS,
  type MetadataOption
} from '../../../../../../packages/dp-datatype/utils/dataTypeHelper'
import { mapDataType, getDefaultByType } from '../../../../../../packages/dp-datatype/utils/globalDataTypeHelper'

const { t } = useI18n()
const validationFormRef = ref<FormInstance>()
const visible = defineModel<boolean>('visible', { required: true })
const selectedType = ref<MetadataOption['name']>('Text')
const emits = defineEmits(['reload'])
const loading = ref(false)
const formData = reactive({
  name: '',
  langs: {},
  maskRule: {
    maskType: 'MASK_ALL',
    maskLength: 10
  },
  validationRule: {
    maxLength: 255,
    validationRuleName: 'text'
  }
})

const elFormRef = ref<FormInstance>()

function open() {
  visible.value = true
}

function close() {
  // clean the form
  elFormRef.value?.resetFields()
  formData.name = ''
  formData.langs = {}
  formData.maskRule = {
    maskType: 'MASK_ALL',
    maskLength: 10
  }
  visible.value = false
}

const ruleFormRef = ref<FormInstance>()

async function handleCreate() {
  try {
    loading.value = true
    // validate the form
    if (elFormRef.value) {
      // step 1 validate the form
      const formValid = await elFormRef.value.validate()
      if (!formValid) {
        return
      }
      const ruleValid = await ruleFormRef.value.validate()
      if (!ruleValid) {
        return
      }
      // step 4 create the metadata
      const result = await newAdminApi.postAdmindmsMetadata(formData).then((res) => res.data)
      if (result) {
        ElMessage.success(
          t('meta.create_success', {
            name: formData.name
          })
        )
        close()
        // wait 1 second to reload for backend delay 
        setTimeout(() => {
          emits('reload', result)
        }, 1000)
      } else {
        ElMessage.error(
          t('meta.create_error', {
            name: formData.name
          })
        )
      }
    }
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

function handleTypeChanged(value: string) {
  formData.validationRule = getDefaultByType(value)
}

defineExpose({
  open,
  close
})
</script>

<style lang="scss" scoped></style>

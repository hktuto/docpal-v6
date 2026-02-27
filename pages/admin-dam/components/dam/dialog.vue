<template>
  <el-dialog v-model="state.visible"
             :close-on-click-modal="false"
             append-to-body
  >
    <template #header>
      {{ $t(`DAM_${state.title}`) }}
      <span v-if="state.title !== 'addNewDAM'"> - {{ state.data.sourceType }}</span>
      <span v-if="state.title === 'editNewConvertion'"> - {{ state.data.label }}</span>
    </template>
    <template #footer>
      <el-button id="DAMSetting__Add__Submit" type="primary" :loading="state.loading" @click="handleSubmit()">
        {{ $t('common_submit') }}
      </el-button>
    </template>
    <el-form label-position="top" ref="FormRef" :model="state.data" @submit.native.prevent>
      <template v-if="state.title === 'addNewDAM'">
        <div class="title">{{ $t('DAM_setupFileExtension') }}</div>
        <el-form-item :label="$t('DAM_fileType')"
                      prop="sourceType"
                      :rules="[{ required: true, message: $t('DAM_fileType') + $t('render.hint.fieldRequired')}]"
        >
          <el-select v-model="state.data.sourceType" filterable clearable @change="handleSourceTypeChange"
                     :placeholder="t('common_selectedIsRequiredMsg')">
            <el-option v-for="(item, index) in state.typeList" :key="index" :label="item.name" :value="item.name" />
          </el-select>
        </el-form-item>
        <div class="title">{{ $t('DAM_convertion') }}</div>
      </template>
      <el-form-item :label="$t('tableHeader_label')"
                    prop="label"
                    :rules="[{ required: true, message: $t('tableHeader_label') + $t('render.hint.fieldRequired')}]"
                    required=""
      >
        <el-input type="text" v-model="state.data.label" :maxlength="10000" />
      </el-form-item>
      <el-form-item prop="name" v-show="false">
        <el-input type="text" v-model="state.data.name" :maxlength="10000" />
      </el-form-item>
      <el-form-item :label="$t('DAM_targetFormat')"
                    prop="targetType"
                    :rules="[{ required: true, message: $t('DAM_targetFormat') + $t('render.hint.fieldRequired')}]"
      >
        <el-select v-model="state.data.targetType" filterable clearable @change="handleTargetTypeChange"
                   :placeholder="t('common_selectedIsRequiredMsg')">
          <el-option v-for="(item, index) in state.targetList" :key="index" :label="item.targetFileType"
                     :value="item.targetFileType" />
        </el-select>
      </el-form-item>
      <template v-if="Object.keys(state.data.operation).includes('action')">
        <div class="title">{{ $t('DAM_operation') }}</div>
        <el-form-item :label="$t('tableHeader_actions')" prop="operation.action">
          <el-select v-model="state.data.operation.action" filterable clearable @change="handleActionChange">
            <el-option :label="$t('zoom')" value="zoom" />
            <el-option :label="$t('compress')" value="compress" />
            <el-option :label="$t('rotate')" value="rotate" />
          </el-select>
        </el-form-item>
        <template v-if="state.data.operation.action === 'zoom'">
          <el-form-item :label="$t('search.height')" prop="operation.height"
                        :rules="[
                            { required: true, message: $t('search.height') + $t('render.hint.fieldRequired'), trigger: 'blur' },
                            { validator: numberValidate, trigger: 'blur'}
                        ]"
          >
            <el-input v-model="state.data.operation.height" type="text" :min="1" :max="9999" />
          </el-form-item>
          <el-form-item :label="$t('search.width')"
                        prop="operation.width"
                        :rules="[
                            { required: true, message: $t('search.width') + $t('render.hint.fieldRequired'), trigger: 'blur' },
                            { validator: numberValidate, trigger: 'blur'}
                        ]"
          >
            <el-input v-model="state.data.operation.width" type="text" :min="1" :max="9999" />
          </el-form-item>
        </template>
        <template v-else-if="state.data.operation.action === 'rotate'">
          <el-form-item :label="$t('dub')"
                        prop="operation.dub"
                        :rules="[
                            { required: true, message: $t('dam.angle') + $t('render.hint.fieldRequired'), trigger: 'blur' },
                            { validator: dubValidate, trigger: 'blur'}
                        ]"
          >
            <template #label>{{ $t('dam.angle') }}
              <el-tooltip placement="top-start" effect="light">
                <template #content>
                  <a v-if="state.data.operation.action === 'rotate'"
                     href="https://imagemagick.org/script/command-line-options.php#rotate" target="_blank">
                    {{ $t('dpTip.jumpToView') }}
                  </a>
                  <a v-else href="https://imagemagick.org/script/command-line-options.php#quality" target="_blank">
                    {{ $t('dpTip.jumpToView') }}
                  </a>
                </template>
                <el-icon class="cursorPointer">
                  <InfoFilled />
                </el-icon>
              </el-tooltip>
            </template>
            <el-input v-model="state.data.operation.dub" type="text" />
          </el-form-item>
        </template>
      </template>
    </el-form>
  </el-dialog>
</template>
<script lang="ts" setup>
import { InfoFilled } from '@element-plus/icons-vue'
import { newClientApi } from 'api'

const emits = defineEmits([
  'refresh'
])

const { t } = useI18n()
const state = reactive<any>({
  loading: false,
  title: '',
  visible: false,
  data: {
    operation: {}
  },
  typeList: [],
  targetList: []
})
const FormRef = ref()

async function handleSubmit() {
  try {
    state.loading = true
    const data = await getFormData()
    data.operation = JSON.stringify(data.operation)
    switch (state.title) {
      case 'addNewDAM':
      case 'addNewConvertion':
        await newClientApi.postDmsDamSettings(data)
        break
      case 'editNewConvertion':
        await newClientApi.putDmsDamSettings(data)
    }

    emits('refresh')
    state.visible = false
  } catch (error) {

  } finally {
    state.loading = false
  }
}

async function getFormData() {
  const valid = await FormRef.value.validate((valid: any, fields: any) => {
    return valid
  })
  if (!valid) return false
  else return deepCopy(state.data)
}

function handleOpen(data: any) {
  state.visible = true
  if (data.targetType) {
    state.title = 'editNewConvertion'
    state.data = data
    editSourceTypeChange(state.data.sourceType)
  } else if (data.sourceType) {
    state.title = 'addNewConvertion'
    state.data = data
    state.data.operation = {}
    handleSourceTypeChange(state.data.sourceType)
  } else {
    state.title = 'addNewDAM'
    state.data = {
      sourceType: data.sourceType,
      operation: {}
    }
  }
  setTimeout(() => {
    FormRef.value.clearValidate()
  })
}

const handleTargetTypeChange = (value?: any) => {
  const targetItem = state.targetList.find((item: any) => item.targetFileType === value)
  console.log(targetItem, state.targetList)
  if (targetItem) {
    state.data.operation = { ...targetItem.operation }
    state.data.name = targetItem.type
  } else {
    state.data.operation = {}
    state.data.name = ''
  }
}

function handleActionChange(clearAction: boolean = true) {
  if (!clearAction) return
  state.data.operation.width = ''
  state.data.operation.height = ''
  state.data.operation.dub = ''
}

const handleTypeListGet = async () => {
  state.typeList = []
  const data = await newClientApi.getDmsDamSettingsFormats().then(r => r.data)
  if (!data) return
  Object.keys(data).forEach(key => {
    state.typeList.push({ name: key, targetList: data[key] })
  })
}
const handleSourceTypeChange = async (value: any, clearTargetType: boolean = true) => {
  const item = state.typeList.find((item: any) => item.name === value)
  state.targetList = item.targetList
  if (clearTargetType) state.data.targetType = ''
  handleTargetTypeChange()
  handleActionChange()
}
const editSourceTypeChange = async (value: any) => {
  const item = state.typeList.find((item: any) => item.name === value)
  state.targetList = item.targetList
}

// #region module: validate
function numberValidate(_rule: any, value: any, callback: any) {
  if (value === '') {
    callback(new Error(t('render.hint.fieldRequired') as string))
  } else if (!/^[1-9]\d*$/.test(value)) {
    callback(new Error(t('dpTip.enterNumber') as string))
  } else {
    callback()
  }
}

function dubValidate(_rule: any, value: any, callback: any) {
  if (value === '') {
    callback(new Error(t('render.hint.fieldRequired') as string))
  } else if (state.data.operation.action === 'rotate' &&
    !/^-?\d+([<>])?$/.test(value)) {
    callback(new Error(t('dam.angleTip') as string))
  } else if (state.data.operation.action === 'compress' &&
    !/^([1-9]\d{0,2}|1000)$/.test(value)) {
    callback(new Error('1-1000'))
  } else {
    callback()
  }
}

// #endregion
onMounted(async () => {
  await handleTypeListGet()
})
defineExpose({ handleOpen })
</script>
<style lang="scss" scoped>
.el-select, .el-radio-group, .el-date-editor.el-input {
  width: 100%
}

.title {
  color: var(--app-grey-950);
  font-weight: bold;
}
</style>

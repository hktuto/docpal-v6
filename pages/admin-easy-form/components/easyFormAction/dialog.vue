<template>
  <el-dialog
    v-model="state.visible"
    :title="state.editMode ? $t('easyForm.actionsEdit') : $t('easyForm_addFormAction')"
    class="scroll-dialog"
    append-to-body
    :close-on-click-modal="false"
  >
    <el-form ref="FormRef" style="--icon-size: 1.2rem" label-position="top" :model="form">
      <el-form-item
        :label="$t('docType_label')"
        prop="actionName"
        :rules="[
          {
            required: true,
            message: $t('docType_label') + $t('render.hint.fieldRequired'),
            trigger: 'blur'
          }
        ]"
      >
        <el-input v-model="form.actionName" />
      </el-form-item>
      <el-form-item
        :label="$t('easyForm.type')"
        prop="actionType"
        :rules="[
          {
            required: true,
            message: $t('easyForm.type') + $t('render.hint.fieldRequired'),
            trigger: 'change'
          }
        ]"
      >
        <el-select-v2
          v-model="form.actionType"
          :placeholder="t('common_selectOccupancyContent')"
          clearable
          :options="typeOptions"
          filterable
          @change="handleChange"
        />
      </el-form-item>
      <template v-if="form.actionType">
        <el-divider content-position="left">
          {{ $t('easyForm_addFormAction' + form.actionType + 'Setting') }}
        </el-divider>
        <el-form-item
          :label="$t('easyForm.' + form.actionType + 'TemplateKey')"
          prop="actionKey"
          :rules="[
            {
              required: true,
              message: $t('easyForm.' + form.actionType + 'TemplateKey') + $t('render.hint.fieldRequired'),
              trigger: 'change'
            }
          ]"
        >
          <el-select-v2
            v-model="form.actionKey"
            :options="state.templateList"
            filterable
            clearable
            :placeholder="t('common_selectOccupancyContent')"
            @change="handleKeyChange"
          />
        </el-form-item>
      </template>
      <template v-if="form.actionType === 'Email'">
        <div class="grid-layout_3">
          <el-form-item v-for="(item, index) in ['to', 'cc', 'bcc']" :key="index" :label="$t(`easyForm_addFormAction_${item}`)">
            <!-- :prop="`dataMapping[${index}].source`" -->
            <el-select-v2
              v-model="form[item]"
              :options="state.userList"
              multiple
              clearable
              collapse-tags
              :placeholder="t('common_selectOccupancyContent')"
              filterable
              collapse-tags-tooltip
            />
          </el-form-item>
        </div>
      </template>
      <template v-if="form.actionKey">
        <h3>{{ $t(`easyForm.${form.actionType}VariableMapping`) }}</h3>
        <div class="grid-layout_3">
          <el-form-item v-for="(item, index) in form.dataMapping" :key="index" :label="getTargetLabel(item.target)">
            <!-- :prop="`dataMapping[${index}].source`" -->
            <ElSelect v-model="item.source" filterable :placeholder="$t('easyform.actionFieldSelect')" clearable>
              <ElOption v-for="option in sourceList" :key="option.value" :label="option.label" :value="option.value" />
            </ElSelect>
            <!-- <el-select-v2 v-model="item.source" filterable :placeholder="$t('easyform.actionFieldSelect')" :options="sourceList" clearable /> -->
          </el-form-item>
        </div>
      </template>
    </el-form>
    <template #footer>
      <div class="footer-grid">
        <el-button id="EasyForm__Detail__FormActions__AddNewFormAction__Submit" type="primary" :loading="state.loading" @click="handleSubmit">
          {{ $t('common_submit') }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>
<script lang="ts" setup>
import { newAdminApi } from 'api'
import { fetchUsersSelectSorted } from '@packages/base/composables/usePermissionOption'
import { ElMessage } from 'element-plus'

const routerProvider = inject(MenuRouterKey)
const { t } = useI18n()
const props = defineProps(['detail'])
const emits = defineEmits(['refresh', 'delete'])
const state = reactive({
  loading: false,
  visible: false,
  setting: {},
  icon: '',
  editMode: false,
  templateList: [],
  targetList: [],
  userList: []
})
const userId: string = useUserId().value
let workflowList = []
let caseList = []
let emailList = []
const form = ref({
  dataMapping: [],
  status: 'A'
})
const sourceList = computed(() => {
  try {
    return props.detail.information.map((item) => ({
      value: item.name,
      label: item.name
    }))
  } catch (error) {
    return []
  }
})
const typeOptions = [
  { label: 'Workflow', value: 'Workflow' },
  { label: 'CaseType', value: 'CaseType' },
  { label: 'Email', value: 'Email' }
]

function getTargetLabel(value) {
  const index = state.targetList.findIndex((i) => i.value === value)
  return index === -1 ? value : state.targetList[index].label
}

function handleOpen(setting: any) {
  if (setting && setting.id) {
    state.editMode = true
    state.setting = JSON.parse(JSON.stringify(setting))
    form.value = {
      ...state.setting,
      to: state.setting.to ? state.setting.to.split(',') : [],
      cc: state.setting.cc ? state.setting.cc.split(',') : [],
      bcc: state.setting.bcc ? state.setting.bcc.split(',') : []
    }
    handleChange(state.setting.actionType, true)
    handleKeyChange(state.setting.actionKey, true)
  } else {
    state.editMode = false
    state.setting = {}
    form.value = {
      actionKey: '',
      actionType: '',
      actionName: '',
      dataMapping: [],
      status: 'A'
    }
  }
  state.visible = true
  setTimeout(() => {
    FormRef.value.clearValidate()
  })
}

const FormRef = ref()

// #region module: action
async function handleSubmit() {
  try {
    await FormRef.value.validate()
  } catch (e) {
    console.error(e)
    return
  }
  const params = {
    id: props.detail.id,
    formResult: {
      ...form.value,
      to: form.value.to ? form.value.to.join(',') : '',
      cc: form.value.cc ? form.value.cc.join(',') : '',
      bcc: form.value.bcc ? form.value.bcc.join(',') : '',
      actionId: form.value.actionKey
    }
  }
  try {
    if (state.editMode) {
      params.formResult.id = state.setting.id
    }
    const action = await newAdminApi.postDmsEasyFormSaveFormresultAppend(params).then((res) => res.data)
    ElMessage.success(t('tip_createdMsg', { modelName: t('tip_newMsg') + t('easyForm_formAction'), name: null }))
    emits('refresh', action)
  } catch (error) {
    console.log(error)
  } finally {
    state.visible = false
    state.loading = false
  }
}

function handleAdd() {
  if (!form.value.dataMapping) form.value.dataMapping = []
  form.value.dataMapping.push({
    source: '',
    target: ''
  })
}

function handleDelete(index: number) {
  form.value.dataMapping.splice(index, 1)
}

// #endregion

// #region module: change
async function handleChange(key, isInit = false) {
  if (!isInit) {
    state.templateList = []
    form.value.actionKey = ''
  }
  switch (key) {
    case 'Workflow':
      await getWorkflow()
      state.templateList = [...workflowList]
      break
    case 'CaseType':
      await getCase()
      state.templateList = [...caseList]
      break
    case 'Email':
      await getEmail()
      state.templateList = [...emailList]
      getUserList()
      break
    default:
      break
  }
}

async function getWorkflow() {
  if (workflowList.length === 0) {
    const res = await newAdminApi.getDmsEasyFormProcessDefinitions().then((res) => res.data)
    workflowList = res.map((item) => ({
      label: item.label,
      value: item.key
    }))
  }
}

async function getCase() {
  if (caseList.length === 0) {
    const res = await newAdminApi.postCaseTypesPage({ pageSize: 9999 }).then((res) => res.data)
    caseList = res.entryList.map((item) => ({
      label: item.name,
      value: item.id,
      productionVersionId: item.productionVersionId
    }))
  }
}

async function getEmail() {
  if (emailList.length === 0) {
    const res = await newAdminApi.getDmsTemplateEmailAll().then((res) => res.data)
    emailList = res.map((item) => ({
      label: item.label,
      value: item.id
    }))
  }
}

// #endregion
// #region module: keyChange
async function handleKeyChange(value: string, isInit = false) {
  if (!isInit) {
    state.targetList = []
    form.value.dataMapping = []
  }
  switch (form.value.actionType) {
    case 'Workflow':
      state.targetList = await getWorkflowProps(value)
      break
    case 'CaseType':
      state.targetList = await getCaseProps(value)
      break
    case 'Email':
      state.targetList = await getEmailProps(value)
      break
    default:
      break
  }

  state.targetList.forEach((item) => {
    const index = form.value.dataMapping.findIndex((fItem) => fItem.target === item.value)
    if (index === -1)
      form.value.dataMapping.push({
        source: '',
        target: item.value
      })
  })
}

async function getWorkflowProps(processKey: string) {
  const options = await newAdminApi.postDocpalWorkflowProperties({ processKey }).then((res) => res.data)
  console.log('getWorkflowProps', options)
  if (!options || options.length == 0) {
    return []
  }
  return options.map((item) => ({
    label: item.name,
    value: item.id
  }))
}

async function getEmailProps(id: string) {
  try {
    const options = await newAdminApi.getDmsTemplateEmailTemplateId(id).then((res) => res.data)
    if (!options || options.length == 0) {
      return []
    }

    const variable = options.emailTemplateVariable ? JSON.parse(options.emailTemplateVariable) : []
    return variable.map((item) => ({
      label: item,
      value: item
    }))
  } catch (error) {
    return []
  }
}

async function getCaseProps(key: string) {
  try {
    const caseItem = caseList.find((item) => item.value === key)

    const options: any = await newAdminApi.getCaseDashboardVersionVersionidPrimaryform(caseItem.productionVersionId).then((res) => res.data)
    if (!options || options.length == 0) {
      return []
    }

    return options.fields.map((item) => ({
      label: item.name,
      value: item.id
    }))
  } catch (error) {
    return []
  }
}

const userListStore = ref([])

async function getUserList() {
  if (userListStore.value.length > 0) {
    state.userList = userListStore.value
    return
  }
  const userList = await fetchUsersSelectSorted()
  const _userList = userList
    .map((item) => ({
      label: item.label || '',
      value: item.value
    }))
    .filter((item) => item.value !== userId)
  // state.userList.unshift(...sourceList.value)
  state.userList = [
    { label: t('easyForm.formInfomation'), value: '', options: sourceList.value },
    { label: t('dataField.type.user'), value: '', options: _userList }
  ]
  userListStore.value = state.userList
}

// #endregion

defineExpose({ handleOpen })
</script>
<style lang="scss" scoped>
.el-row {
  // margin-bottom: var(--app-space-xs);
  align-items: center;
}

.el-divider--horizontal {
  margin: var(--app-space-l) 0 !important;
}

.svgIcon {
  margin-bottom: 18px;
}

.grid-layout_3 {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: var(--app-space-xs);
}
</style>

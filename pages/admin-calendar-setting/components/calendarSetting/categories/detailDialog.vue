<script lang="ts" setup>
import { ElColorPicker, ElDialog } from 'element-plus'
import { newAdminApi } from 'api'

const routerProvider = inject(MenuRouterKey)

const { t } = useI18n()
const { locationsOption } = useCalendarStore()
const emits = defineEmits(['submit'])
const currentData = ref()
const opened = ref(false)
const isEdit = ref(false)
const formRef = ref()
const rules = reactive({
  name: [
    { required: true, message: t('render.hint.fieldRequired', { name: t('Name') }), trigger: 'blur' }
  ],
  availableSeat: [
    { required: true, message: t('render.hint.fieldRequired', { name: t('AvailableSeat') }), trigger: 'blur' }
  ]
})
const permissionOptions = ref([])
const userOptions = ref([])
const roleOptions = ref([])
const groupOptions = ref([])
const locationsOptions = ref([])
const limitSeat = ref(false)
// TODO 在創建時會默認加載以下的workflow
const defWorkflow = ref()

async function generateDefWorkflow(name: string) {
  const date = Date.now()
  const defWorkflowList: any = []

  // TODO: 通過篩選名稱包含 "Def Calendar Event By" 的字段獲取workflow信息，後續需要後端配置一個默認的系統workflow組以便區分
  const params = {
    isDesc: true,
    name: 'Def Calendar Event By',
    orderBy: 'modifiedDate',
    categories: ['business_processes', 'system_processes']
  }

  const { entryList } = await newAdminApi.postAdmindocpalWorkflowProcessDefinitionDraftPage(params).then((r) => r.data)

  const eventActions: any = {
    'Def Calendar Event By Create': 'Create',
    'Def Calendar Event By Update': 'Update',
    'Def Calendar Event By Cancel': 'Cancel',
    'Def Calendar Event By Delete': 'Delete'
  }
  entryList.forEach((entryItem: any) => {
    const action = eventActions[entryItem.name]
    if (action) {
      const defWorkflowItem = {
        key: `${entryItem.key}_${date}`,
        name: `${name} - ${action} Calendar Event`,
        type: entryItem.key
      }
      defWorkflowList.push(defWorkflowItem)
    }
  })

  if (defWorkflowList.length < 4) {
    throw new Error('Missing default workflow')
  }
  return defWorkflowList
}

async function init() {
  permissionOptions.value = await getPermissionSelectOption()

  userOptions.value = permissionOptions.value[0].options
  roleOptions.value = permissionOptions.value[1].options
  groupOptions.value = permissionOptions.value[2].options
  locationsOptions.value = locationsOption.value.map((item: any) => ({
    id: item.id,
    name: item.name
  }))
}

const state = reactive({
  viewList: [],
  updateList: [],
  createList: [],
  cancelList: [],
  removeList: [],
  exportList: [],
  locationList: []
})

function initPermission() {
  state.viewList = mergeAllArrays(currentData.value.permission.view)
  state.updateList = mergeAllArrays(currentData.value.permission.update)
  state.createList = mergeAllArrays(currentData.value.permission.create)
  state.cancelList = mergeAllArrays(currentData.value.permission.cancel)
  state.removeList = mergeAllArrays(currentData.value.permission.remove)
  state.exportList = mergeAllArrays(currentData.value.permission.export)

  const list = []
  if (currentData.value.location?.value?.length > 0) {
    currentData.value.location.value.forEach((values: any) => {
      const find = locationsOptions.value.find((lOp: any) => lOp.id === values.id)
      if (find) {
        list.push(values.id)
      }
    })
  }
  state.locationList = list
}

function mergeAllArrays(item: any) {
  const list = []
  for (const key in item) {
    if (Object.prototype.hasOwnProperty.call(item, key)) {
      const value = item[key]
      if (Array.isArray(value)) {
        list.push(...fillList(value))
      }
    }
  }
  return list
}

function fillList(list: any) {
  const newList = []
  list.forEach((itemKey: string) => {
    if (userOptions.value.find((ui: any) => ui.value.includes(itemKey))) {
      newList.push(`user_${itemKey}`)
    } else if (roleOptions.value.find((ui: any) => ui.value.includes(itemKey))) {
      newList.push(`role_${itemKey}`)
    } else if (groupOptions.value.find((ui: any) => ui.value.includes(itemKey))) {
      newList.push(`group_${itemKey}`)
    }
  })
  return newList
}

async function open(item?: any) {
  await init()
  if (item) {
    isEdit.value = true
    currentData.value = deepCopy(item)
    if (typeof item.status === 'string') {
      currentData.value.status = item.status === 'true'
    }
    limitSeat.value = currentData.value.availableSeat > 0
    initPermission()
  } else {
    isEdit.value = false
    currentData.value = {
      permission: {},
      location: {},
      availableSeat: 0,
      backgroundColor: '#FFFFFF',
      textColor: '#000000',
      highlightColor: '#FFFFFF',
      status: false
    }
  }
  opened.value = true
}

function fillPermissionObject(itemKey: string) {
  switch (itemKey) {
    case 'view':
      currentData.value.permission.view = fillItem(state.viewList)
      break
    case 'update':
      currentData.value.permission.update = fillItem(state.updateList)
      break
    case 'create':
      currentData.value.permission.create = fillItem(state.createList)
      break
    case 'cancel':
      currentData.value.permission.cancel = fillItem(state.cancelList)
      break
    case 'remove':
      currentData.value.permission.remove = fillItem(state.removeList)
      break
    case 'export':
      currentData.value.permission.export = fillItem(state.exportList)
      break
  }
}

function fillItem(list: any) {
  const item = {
    USERS: [],
    ROLE: [],
    GROUPS: []
  }

  list.forEach((key: string) => {
    if (key.includes('user_')) {
      item.USERS.push(key.split('user_')[1])
    } else if (key.includes('role_')) {
      item.ROLE.push(key.split('role_')[1])
    } else if (key.includes('group_')) {
      item.GROUPS.push(key.split('group_')[1])
    }
  })

  Object.keys(item).forEach((prop) => {
    if (item[prop].length === 0) {
      delete item[prop]
    }
  })

  return item
}

async function submit() {
  if (!limitSeat) currentData.value.availableSeat = 0

  try {
    await formRef.value.validate()
  } catch (e) {
    return
  }

  try {
    if (isEdit.value) {
      const result = await newAdminApi.putAdmindmsCalendarsEventSettingId(currentData.value.id, currentData.value).then(r => r.data)
      routerProvider?.message.success(t('tip_updateSuccessMsg', { modelName: null, name: currentData.value.name }))
    } else {
      // TODO use def value
      defWorkflow.value = await generateDefWorkflow(currentData.value.name)
      currentData.value.flows = defWorkflow.value
      const result = await newAdminApi.postAdmindmsCalendarsEventSetting(currentData.value).then(r => r.data)
      routerProvider?.message.success(t('tip_createdSuccessMsg', { modelName: null, name: currentData.value.name }))
    }
  } catch (e) {
    throw new Error(e)
  }
  emits('submit')
  opened.value = false
}

async function handleJumpWorkflow(workflowKey: string) {
  if (!workflowKey) return

  const data = await newAdminApi.getAdminworkflowDefinitionVersionKeyProcessdefinitionkey(workflowKey).then((r) => r.data)
  if (!data) return

  const params: NewWorkflowVersionDetailParams = {
    id: data.draftId,
    name: data.name,
    draftId: data.draftId,
    versionNumber: data.versionNumber,
    versionId: data.processDefinitionId
  }
  let newItem = newWorkflowEditorDetail(params) as any
  routerProvider?.navigateTo(newItem, false)
}

watch(() => state.locationList, () => {
  const location = []
  if (state.locationList?.length > 0) {
    state.locationList.forEach((item: string) => {
      const find = locationsOptions.value.find((o: any) => o.id === item)
      if (find) {
        location.push(find)
      }
    })
  }
  currentData.value.location.value = location
})
defineExpose({ open })
</script>

<template>
  <ElDialog v-model="opened" :title="isEdit ? $t('Edit Calendar') : $t('Create Calendar')" top="5vh" width="800px">
    <el-form ref="formRef" :model="currentData" label-position="top" :rules="rules">
      <h4>Information</h4>
      <el-form-item :label="t('Name') " prop="name">
        <el-input id="CalendarSetting__EventLocations__EventCategories__Add__Name"
                  v-model="currentData.name" />
      </el-form-item>

      <el-form-item :label="t('Allow External User To Register')">
        <el-switch id="CalendarSetting__EventLocations__EventCategories__Add__AllowExternalUserToRegister"
                   v-model="currentData.register" active-text="Yes" inactive-text="No" />
      </el-form-item>

      <el-divider />

      <h4>Permission</h4>
      <el-row :gutter="10">
        <el-col :span="12">
          <el-form-item :label="t('View')">
            <el-select id="CalendarSetting__EventLocations__EventCategories__Add__View" v-model="state.viewList"
                       multiple filterable clearable collapse-tags placeholder="Select" :max-collapse-tags="2"
                       collapse-tags-tooltip @blur="fillPermissionObject('view')">
              <el-option-group v-for="group in permissionOptions" :key="group.label" :label="group.label">
                <el-option v-for="item in group.options" :key="item.value" :label="item.label" :value="item.value" />
              </el-option-group>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item :label="t('Update')">
            <el-select id="CalendarSetting__EventLocations__EventCategories__Add__Update" v-model="state.updateList"
                       multiple filterable clearable collapse-tags placeholder="Select" :max-collapse-tags="2"
                       collapse-tags-tooltip @blur="fillPermissionObject('update')">
              <el-option-group v-for="group in permissionOptions" :key="group.label" :label="group.label">
                <el-option v-for="item in group.options" :key="item.value" :label="item.label" :value="item.value" />
              </el-option-group>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item :label="t('Create')">
            <el-select id="CalendarSetting__EventLocations__EventCategories__Add__Create" v-model="state.createList"
                       multiple filterable clearable collapse-tags placeholder="Select" :max-collapse-tags="2"
                       collapse-tags-tooltip @blur="fillPermissionObject('create')">
              <el-option-group v-for="group in permissionOptions" :key="group.label" :label="group.label">
                <el-option v-for="item in group.options" :key="item.value" :label="item.label" :value="item.value" />
              </el-option-group>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item :label="t('Cancel')">
            <el-select id="CalendarSetting__EventLocations__EventCategories__Add__Cancel" v-model="state.cancelList"
                       multiple filterable clearable collapse-tags placeholder="Select" :max-collapse-tags="2"
                       collapse-tags-tooltip @blur="fillPermissionObject('cancel')">
              <el-option-group v-for="group in permissionOptions" :key="group.label" :label="group.label">
                <el-option v-for="item in group.options" :key="item.value" :label="item.label" :value="item.value" />
              </el-option-group>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item :label="t('Remove')">
            <el-select id="CalendarSetting__EventLocations__EventCategories__Add__Remove" v-model="state.removeList"
                       multiple filterable clearable collapse-tags placeholder="Select" :max-collapse-tags="2"
                       collapse-tags-tooltip @blur="fillPermissionObject('remove')">
              <el-option-group v-for="group in permissionOptions" :key="group.label" :label="group.label">
                <el-option v-for="item in group.options" :key="item.value" :label="item.label" :value="item.value" />
              </el-option-group>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item :label="t('Export')">
            <el-select id="CalendarSetting__EventLocations__EventCategories__Add__Export" v-model="state.exportList"
                       multiple filterable clearable collapse-tags placeholder="Select" :max-collapse-tags="2"
                       collapse-tags-tooltip @blur="fillPermissionObject('export')">
              <el-option-group v-for="group in permissionOptions" :key="group.label" :label="group.label">
                <el-option v-for="item in group.options" :key="item.value" :label="item.label" :value="item.value" />
              </el-option-group>
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-divider />

      <el-form-item :label="t('Location Options')">
        <el-select id="CalendarSetting__EventLocations__EventCategories__Add__LocationOptions"
                   v-model="state.locationList" multiple collapse-tags placeholder="Select" style="width: 50%">
          <el-option v-for="item in locationsOptions" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
      </el-form-item>
      <el-row :gutter="10">
        <el-col :span="6">
          <el-form-item :label="t('Allow New Location')">
            <el-switch id="CalendarSetting__EventLocations__EventCategories__Add__AllowNewLocation"
                       v-model="currentData.location.newLocation" active-text="Yes" inactive-text="No" />
          </el-form-item>
        </el-col>
        <el-col :span="18">
          <el-form-item :label="t('Allow Empty')">
            <el-switch id="CalendarSetting__EventLocations__EventCategories__Add__AllowEmpty"
                       v-model="currentData.location.empty" active-text="Yes" inactive-text="No" />
          </el-form-item>
        </el-col>
      </el-row>

      <h4>Seat Options</h4>
      <el-row :gutter="10">
        <el-col :span="6">
          <el-form-item :label="t('Limit Seat')">
            <el-switch id="CalendarSetting__EventLocations__EventCategories__Add__LimitSeat" v-model="limitSeat"
                       active-text="Yes" inactive-text="No" />
          </el-form-item>
        </el-col>
        <el-col :span="18">
          <el-form-item v-if="limitSeat" :label="t('Available Seat')" prop="availableSeat">
            <el-input-number id="CalendarSetting__EventLocations__EventCategories__Add__AvailableSeat"
                             v-model="currentData.availableSeat" controls-position="right" min="0" max="99999999"
                             :step="1" step-strictly style="width: 100%" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-divider />

      <h4>Style</h4>
      <el-row>
        <el-col :span="8">
          <el-form-item :label="t('Background Color')">
            <el-color-picker id="CalendarSetting__EventLocations__EventCategories__Add__BackgroundColor"
                             v-model="currentData.backgroundColor" color-format="hex" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item :label="t('Text Color')">
            <el-color-picker id="CalendarSetting__EventLocations__EventCategories__Add__TextColor"
                             v-model="currentData.textColor" color-format="hex" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item :label="t('Highlight Color')">
            <el-color-picker id="CalendarSetting__EventLocations__EventCategories__Add__HighlightColor"
                             v-model="currentData.highlightColor" color-format="hex" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-divider />

      <div v-if="isEdit">
        <el-form-item :label="t('Flows')">
          <template v-for="item in currentData.flows">
            <el-button :id="`CalendarSetting__EventLocations__EventCategories__Add__${item.name}}`" type="info"
                       @click="handleJumpWorkflow(item.key)">{{ item.name }}
            </el-button>
          </template>
        </el-form-item>
        <el-divider />
      </div>

      <el-form-item :label="t('Status')">
        <el-switch id="CalendarSetting__EventLocations__EventCategories__Add__Status" v-model="currentData.status"
                   active-text="Active" inactive-text="No" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button id="CalendarSetting__EventLocations__EventCategories__Add__Dialog__Cancel" @click="opened = false">
        {{ t('Cancel') }}
      </el-button>
      <el-button type="primary" @click="submit"
                 :id="`CalendarSetting__EventLocations__EventCategories__Add__Dialog__${isEdit ? 'Save' : 'Create'}`">
        {{ isEdit ? t('Save') : t('Create') }}
      </el-button>
    </template>
  </ElDialog>
</template>

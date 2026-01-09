<script setup lang="ts">
import { clientApi } from 'api'
const state = reactive<any>({
  visible: false,
  allList:[],
  data: {
    fields: [],
  },
  setting: {
    label: '',
    selectedField: "",
    steps:[],
  },
})

const caseProvider: any = inject(CaseManagementDashboardKey)
const emits = defineEmits(['refresh'])
const { t } = useI18n()
async function getCDBasciInfo() {
  try {
    // remove this line, cause it will cause refresh data
    // if (state.data?.fields?.length > 0) return state.data
    const id = caseProvider.instanceId?.value || null
    const versionId = caseProvider.versionId?.value || null
    if (id) {
      // in client platform
      state.mode = 'normal'
      state.data = await clientApi.api.getCaseDashboardInstanceCaseidPrimaryformData(id).then(r => r.data)
    } else if (versionId) {
      // in admin platform
      state.mode = 'develop'
      const { data: form }: any = await clientApi.api.getCaseDashboardVersionVersionidPrimaryform(versionId)
      form.rows = form.fields.reduce((prev: any, item: any) => {
        let value = item.type
        if (item.type === 'date') value = '2024-01-01'
        else if (item.type === 'number') value = 100
        else value = t(`virtual.${item.type}_${item.name}`)
        prev.push({ ...item, value })
        return prev
      }, [])
      state.data = form
    } else {
      state.data = {
        fields: [],
      }
    }
  } catch (error) {
    console.log('getCDBasciInfo error', error)
    state.data = {
      fields: [],
    }
  } finally {
    return state.data
  }
}
const handleOpen = async (setting:any) => {
  await getCDBasciInfo()
  state.visible = true
  setTimeout(async () => {
    
    state.setting = deepCopy(setting)
    state.loading = false
  })
}
const handleClose = () => {
  emits('refresh', state.setting)
  state.visible = false
}
const handleSelectedFieldChange = (value: string) => {
  state.setting.steps = []
}
const handleStepChange = (index: number, value: string) => {
  console.log('handleStepChange', index, value)
  state.setting.steps[index] = value
}

defineExpose({ handleOpen, handleClose })
</script>

<template>
  <el-dialog v-model="state.visible" :title="$t('dashboard.setting')" class="scroll-dialog" append-to-body :close-on-click-modal="false">
    <ElForm label-position="top" >
      <ElFormItem label="Label">
        <el-input v-model="state.setting.label" />
      </ElFormItem>
      <ElFormItem label="Selected Field">
        <el-select v-model="state.setting.selectedField" filterable allow-create @change="handleSelectedFieldChange">
          <el-option v-for="item in state.data.fields" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
      </ElFormItem>
      <div v-if="state.setting.selectedField" class="listContainer">
        <div class="step-item" v-for="(item,index) in state.setting.steps" :key="item">
          
          <ElFormItem label="Label">
            <ElInput v-model="item.label" />
          </ElFormItem>
          <ElFormItem label="Value">
            <ElInput v-model="item.value" />
          </ElFormItem>
          <ElButton class="remove-button" type="link" text @click="state.setting.steps.splice(index, 1)">remove</ElButton>
        </div>
        <div class="add-row">
          <ElButton type="link" text @click="state.setting.steps.push({label:'',value:''})"> Add Step </ElButton>
        </div>
      </div>
    </ElForm>
    <template #footer>
      <ElButton type="primary" @click="handleClose">{{ $t('common_submit') }}</ElButton>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped>
.step-item{
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-start;
  align-items: center;
  gap: var(--app-space-xs);
  width: 100%;
  > * {
    flex: 1 0 auto;
  }
  >.remove-button{
    flex: 0 0 auto;
  }
}
</style>

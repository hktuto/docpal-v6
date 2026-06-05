<template>
  <el-dialog
    v-model="state.visible"
    :title="title ? title : $t('dashboard.setting')"
    :class="{ 'scroll-dialog': true, big: big }"
    append-to-body
    :close-on-click-modal="false"
    @close="state.visible = false"
  >
    <slot></slot>
    <FormRenderer ref="FormRendererRef" :form-json="formJson" @formChange="handleFormChange" @tabClick="handleTabClick">
      <template v-slot:dialog_displayColumns>
        <FormSlotDisplayColumn ref="DisplayColumnRef" @change="handleDisplayColumnChange" />
      </template>
      <template v-slot:caseEchart>
        <FormSlotEchart v-if="state.echartShow" ref="EchartRef" :componentName="componentName" :setting="state.realTimeSetting" />
      </template>

    </FormRenderer>
    <template #footer>
      <div class="footer-grid">
        <el-button id="" type="danger" @click="handleDelete">
          {{ $t('common_delete') }}
        </el-button>
        <el-button id="" type="primary" :loading="state.loading" @click="handleSubmit">
          {{ $t('common_submit') }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>
<script lang="ts" setup>
import { ElMessageBox } from 'element-plus'

const props = defineProps(['formJson', 'title', 'after-open', 'big', 'displayColumnsSetting', 'componentName'])
const emits = defineEmits(['refresh', 'delete'])
const state = reactive({
  loading: false,
  visible: false,
  setting: {},
  realTimeSetting: {},
  echartShow: true,
  initCloumnLoading: false
})
const FormRendererRef = ref()
const DisplayColumnRef = ref()
async function handleSubmit() {
  try {
    state.loading = true
    let data: any = await FormRendererRef.value.getFormData()
    if (DisplayColumnRef.value) {
      console.log('DisplayColumnRef.value.getData()', DisplayColumnRef.value.getData())
      data = { ...data, displayColumns: DisplayColumnRef.value.getData() }
    }
    emits('refresh', data)
    state.visible = false
  } catch (error) {
  } finally {
    state.loading = false
  }
}
const EchartRef = ref()
function handleTabClick(tab, evt) {
  state.echartShow = false
  nextTick(() => {
    state.echartShow = true
  })
}
function handleOpen(setting) {
  state.visible = true
  setTimeout(async () => {
    state.setting = setting
    state.realTimeSetting = JSON.parse(JSON.stringify(setting))
    await FormRendererRef.value.vFormRenderRef.setFormData(setting)
    state.loading = false
    if (props.afterOpen) {
      props.afterOpen(FormRendererRef.value)
    }
    if (DisplayColumnRef.value) {
      DisplayColumnRef.value.initColumns(setting)
      const displayColumns = setting.displayColumns ? setting.displayColumns : []
      handleDisplayColumnChange(displayColumns)
      state.initCloumnLoading = true
      setTimeout(() => {
        state.initCloumnLoading = false
      }, 1000)
    }
  })
}
function handleFormChange({ fieldName, newValue, formModel, oldValue }: any) {
  if (!state.initCloumnLoading && oldValue && newValue && fieldName === 'fields' && oldValue !== newValue && DisplayColumnRef.value) {
    DisplayColumnRef.value.initColumns(formModel)
  }
  if (EchartRef.value) {
    state.realTimeSetting = JSON.parse(JSON.stringify(formModel))
    // nextTick(() => {
    //   EchartRef.value.refresh()
    // })
  }
}
function handleDisplayColumnChange(data: any) {
}
async function handleDelete() {
  const action = await ElMessageBox.confirm(`${$i18n.t('msg_confirmWhetherToDelete')}`).catch((action) => action)
  if (action !== 'confirm') return
  emits('delete')
  state.visible = false
}

defineExpose({ handleOpen, FormRendererRef })
</script>
<style lang="scss" scoped></style>

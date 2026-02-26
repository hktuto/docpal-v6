<template>
  <v-form-designer ref="vFormDesignerRef" :designer-config="_designerConfig" :fieldListApi="fieldListApi">
    <template #customToolButtons>
      <el-button type="text" @click="autoGenerate">{{$t('button.autoGenerate')}}</el-button>
    </template>
    <template v-for="(idx, slotName) in $slots">
      <slot :name="slotName"></slot>
    </template>
  </v-form-designer>
</template>

<script lang="ts" setup>
import type { FormJson, FieldListApiType, FormConfig, FormDesigner } from '@/types/vform'
import { useMetadata } from '@/components/meta/metadata'
import { ElMessage } from 'element-plus'

/** 延迟加载 v-form-designer，避免打包后 TDZ 报错 */
await useNuxtApp().$vFormReady();

const { initMetadataVformOptions, getVFormVariableListByMetadata, vFormWidgetListDecorator, turnWorkflowRuleToBackendMetadata } = useMetadata()
const props = defineProps<{
  fieldListApi?: FieldListApiType
  designerConfig?: FormConfig
}>()
const { t } = useI18n()
const _designerConfig = computed((): FormConfig => {
  const designerConfig = props.designerConfig || {}
  return {
    languageMenu: false, //是否显示语言切换菜单
    externalLink: false, //是否显示GitHub、文档等外部链接
    formTemplates: false, //是否显示表单模板
    eventCollapse: true, //是否显示组件事件属性折叠面板
    widgetNameReadonly: false, //禁止修改组件名称

    clearDesignerButton: true, //是否显示清空设计器按钮
    previewFormButton: true, //是否显示预览表单按钮
    importJsonButton: true, //是否显示导入JSON按钮
    exportJsonButton: true, //是否显示导出JSON器按钮
    exportCodeButton: false, //是否显示导出代码按钮
    generateSFCButton: false, //是否显示生成SFC按钮

    toolbarMaxWidth: 450, //设计器工具按钮栏最大宽度（单位像素）
    toolbarMinWidth: 300, //设计器工具按钮栏最小宽度（单位像素）

    presetCssCode: '', //设计器预设CSS样式代码

    resetFormJson: false, //是否在设计器初始化时将表单内容重置为空
    ...designerConfig
  }
})
const vFormDesignerRef = ref<FormDesigner>()
function setFormJson(json: FormJson) {
  if (!json) {
    vFormDesignerRef.value?.clearDesigner()
    vFormDesignerRef.value?.refreshDesigner()
    return
  }
  /**
   * old migrate function , change axious to $api
   */
  // let st = JSON.stringify(json);
  // st = st.replaceAll('this.$axios','$api').replaceAll('_$api','$api');
  // st = st.replaceAll('this.$cookies.get','$getCookie')
  // st = st.replaceAll('yyyy-MM-dd','YYYY-MM-DD')
  // json = JSON.parse(st);
  vFormDesignerRef.value?.clearDesigner()
  vFormDesignerRef.value?.refreshDesigner()
  vFormDesignerRef.value?.setFormJson(json)
}
function getFormJson(): any {
  return vFormDesignerRef.value?.getFormJson()
}

async function autoGenerate() {
  if (!props.fieldListApi || !props.fieldListApi.data || props.fieldListApi.data.length === 0) {
    ElMessage.info(t('dpMsg_noDataUpdate'))
    return
  }
  const testData = JSON.parse(JSON.stringify(props.fieldListApi.data))
  // props.fieldListApi.data.push({
  //   name: 'test_subForm',
  //   id: 'test_subForm',
  //   validationName: 'sub_form',
  //   validationRule: {
  //     type: 'sub_form',
  //     widgetList: [{
  //       validationName: 'text',
  //       maxLength: 100,
  //       label: 'test_subForm_item',
  //       name: 'test_subForm_item',
  //     }]
  //   }
  // })
  const backendMetadataList = turnWorkflowRuleToBackendMetadata(props.fieldListApi.data)
  const metadataVariableList = await initMetadataVformOptions(backendMetadataList, false)
  
  const variableList = getVFormVariableListByMetadata(metadataVariableList)
  const widgetList = vFormWidgetListDecorator(variableList)
  const oldFieldList = vFormDesignerRef.value?.getFieldWidgets()
  const newFieldList = widgetList.filter((item) => !oldFieldList.some((oldItem) => oldItem.name === item.options?.name))
  if (newFieldList.length === 0) {
    ElMessage.info(t('dpMsg_noDataUpdate'))
    return
  }
  const formJson = vFormDesignerRef.value?.getFormJson()
  formJson.widgetList.push(...newFieldList)
  vFormDesignerRef.value?.setFormJson(formJson)
  ElMessage.success(t('dpMsg_success'))
}
defineExpose({ vFormDesignerRef, setFormJson, getFormJson })
</script>

<style lang="scss" scoped>
:deep(.el-header.main-header) {
  display: none;
}
:deep(.redPoint) {
  width: 0.5rem;
  height: 0.5rem;
  background-color: red;
  border-radius: 50%;
  position: absolute;
  top: 2px;
  left: 0px;
}
:deep(.el-form-item__label) {
  position: relative;
}
:deep(.center-layout-container) {
  .el-main {
    overflow: hidden;
  }
}
</style>

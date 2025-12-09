<template>
  <el-dialog
    v-model="state.visible"
    :title="$t('dashboard.setting')"
    class="scroll-dialog"
    append-to-body
    :close-on-click-modal="false"
    destroy-on-close
  >
    <FormRenderer ref="FormRendererRef" :form-json="formJson" @formChange="handleFormChange">
      <template v-slot:dialog_displayColumns>
        <FormSlotDisplayColumn ref="DisplayColumnRef" />
      </template>
    </FormRenderer>
    <template #footer>
      <div class="footer-grid">
        <el-button type="primary" :loading="state.loading" @click="handleSubmit">{{
          $t("common_submit")
        }}</el-button>
      </div>
    </template>
  </el-dialog>
</template>
<script lang="ts" setup>
import { ElMessageBox } from "element-plus";
import formJson from './setting.vform.json'
const emits = defineEmits(["refresh", "delete"]);
const { t } = useI18n()

const state = reactive({
  loading: false,
  visible: false,
  setting: {},
});
const FormRendererRef = ref();
const DisplayColumnRef = ref();
function handleFormChange({ fieldName, newValue, formModel, oldValue }: any) {
  if (newValue && fieldName === 'fields' && oldValue !== newValue && DisplayColumnRef.value) {
    DisplayColumnRef.value.initColumns(formModel)
  }
}

async function handleSubmit() {
  state.loading = true;
  try {
    let data = await FormRendererRef.value.getFormData();
    if (DisplayColumnRef.value) {
      const displayColumns = DisplayColumnRef.value.getData()
      data = { ...data, displayColumns:JSON.parse(JSON.stringify(displayColumns)) }
    }
    emits("refresh", structuredClone(toRaw(data)));
  } catch (error) {
    console.log('handleSubmit error', error)
    state.loading = false;
  }
  state.visible = false;
  state.loading = false;
}
function handleOpen(setting) {
  state.visible = true;
  setTimeout(async () => {
    state.setting = JSON.parse(JSON.stringify(setting));
    await FormRendererRef.value.vFormRenderRef.setFormData(state.setting);
    if (DisplayColumnRef.value) {
      DisplayColumnRef.value.initColumns(setting)
    }
    state.loading = false;
  });
}

defineExpose({ handleOpen });
</script>
<style lang="scss" scoped></style>

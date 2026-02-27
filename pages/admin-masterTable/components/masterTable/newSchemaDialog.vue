<template>
  <el-dialog
    :title="$t('masterTable_createAddColumn')"
    v-model="state.visible"
    class="scroll-dialog"
    append-to-body
    :close-on-click-modal="false"
  >
    <FormRenderer
      ref="FormRendererRef"
      :form-json="formJson"
      @form-change="handleFormChange"
    >
      <template #defaultValues>
        <MasterTableVariableForm ref="FormVariablesRendererRef"/>
      </template>
    </FormRenderer>
    <template #footer>
      <div class="dialog-footer">
        <div class="flex-x-start">
          <div v-if="type !== 'again'">
            <span class="el-icon--left">{{ $t("dpTable_unique") }}</span>
            <el-switch
              v-model="state.form.unique"
              :disabled="state.options.disabledUnique"
              @change="handleUniqueChange"
            />
          </div>
          <div>
            <span class="el-icon--left">{{ $t("form_isRequire") }}</span>
            <el-switch
              v-model="state.form.required"
              :disabled="state.options.disabledRequired"
              @change="setFieldRequired"
            />
          </div>
        </div>
        <el-button id="MasterTable__Tables__CreateNewMasterTable__AddColumn__Confirm" type="primary" @click="handleConfirm">
          {{ $t("confirm") }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>
<script lang="ts" setup>
import formJson from "./newSchemaDialog.vform.json";

/**
 * 如果 type === 'again',
 * 显示默认值填写框
 * 默认值有两种可能
 */
const props = defineProps(["type"]);
const emits = defineEmits(["update", "delete", "add"]);
const state = reactive<any>({
  loading: false,
  visible: false,
  options: {
    edit: false,
    disabledUnique: false,
    disabledRequired: false,
  },
  setting: {},
  form: {
    unique: false,
    required: false,
  },
  curDefaultField: {},
});
const disabledUniqueDataTypes = ["clob", "json", "boolean"];
const FormRendererRef = ref();

// #region module: form change
function handleUniqueChange(value) {
  if (value) {
    state.form.required = true;
    state.options.disabledRequired = true;
  } else {
    state.options.disabledRequired = false;
  }
}

const FormVariablesRendererRef = ref();

function handleFormChange({fieldName, formModel, newValue, oldValue}: any) {
  if (props.type === "again") {
    handleAgainFormChange({fieldName, formModel, newValue, oldValue});
    return;
  }
  if (fieldName === "dataType") setUnique(newValue);
}

function setUnique(value: string) {
  if (disabledUniqueDataTypes.includes(value)) {
    state.options.disabledUnique = true;
    state.form.unique = false;
  } else {
    state.options.disabledUnique = false;
  }
}

function handleAgainFormChange({fieldName, formModel, newValue, oldValue}: any) {
  if (fieldName === "dataType") {
    const disabledRequiredDataType = ["clob", "json", "boolean"];
    if (disabledRequiredDataType.includes(newValue)) {
      state.options.disabledRequired = true;
      state.form.required = false;
    } else {
      state.options.disabledRequired = false;
    }
  }
  const field: any = {
    id: "defaultValue",
    label: "defaultValue",
    required: state.form.required,
    dataType: "varchar:255",
  };
  const relationFields = ["dataType", "relationTable", "relationField", "displayField"];
  const defaultDataType = [
    "varchar:4000",
    "varchar:255",
    "bigint",
    "decimal",
    "timestamp",
    "boolean",
  ];
  if (
    relationFields.includes(fieldName) &&
    formModel.dataType === "relation" &&
    formModel.relationTable &&
    formModel.relationField &&
    formModel.displayField
  ) {
    field.relationTable = formModel.relationTable;
    field.relationField = formModel.relationField;
    field.displayField = formModel.displayField;
    FormVariablesRendererRef.value.init([field], {});
    state.curDefaultField = {...state.curDefaultField, ...field};
    renderDefaultFieldForm();
  } else if (
    fieldName === "dataType" &&
    newValue !== "relation" &&
    newValue &&
    defaultDataType.includes(newValue)
  ) {
    field.dataType = formModel.dataType;
    state.curDefaultField = {...field};
    renderDefaultFieldForm();
  } else if (fieldName !== "fieldName") {
    state.curDefaultField = {};
    renderDefaultFieldForm();
  }
}

function setFieldRequired() {
  state.curDefaultField.required = state.form.required;
  try {
    const widget = FormVariablesRendererRef.value.getWidgetRef("defaultValue");
    widget.setRequired(state.form.required);
  } catch (error) {
  }
}

function renderDefaultFieldForm() {
  const renderFields = state.curDefaultField.label ? [state.curDefaultField] : [];
  FormVariablesRendererRef.value.init(renderFields, {});
}

// #endregion
async function handleOpen(row: any = {}, options: any = {}) {
  try {
    state.options = options;
    state.visible = true;
    setUnique(row.dataType);
    if (row.required || row.required === false) state.form.required = row.required;
    if (row.unique) {
      state.form.unique = row.unique;
      state.form.required = true;
    } else state.form.unique = false;

    state.setting = {...row};
    setTimeout(async () => {
      FormRendererRef.value.vFormRenderRef.resetForm();
      await FormRendererRef.value.vFormRenderRef.setFormData({...state.setting});
    });
  } catch (error) {
  } finally {
    state.curDefaultField = {};
    state.loading = false;
  }
}

async function handleConfirm() {
  try {
    let data = await FormRendererRef.value.getFormData();
    data = Object.keys(data).reduce((prev: any , key) => {
      if (data[key]) prev[key] = data[key];
      return prev;
    }, {});
    if (props.type === "again") {
      const defaultForm = await FormVariablesRendererRef.value.getData();
      if (!defaultForm) return
      if (defaultForm.defaultValue || defaultForm.defaultValue === 0) {
        data.defaultValue = defaultForm.defaultValue;
      }
    }
    if (state.options.edit) emits("update", {...data, ...state.form});
    else emits("add", {...data, ...state.form});
    state.visible = false;
  } catch (error: any) {
    console.error(error)
  }
}

defineExpose({handleOpen});
</script>
<style lang="scss" scoped>
.flex-x-start {
  gap: 10px;
}

.dialog-footer {
  display: flex;
  justify-content: space-between;
}

:deep(.slot-wrapper-render .formContainer) {
  min-height: unset;
}
</style>

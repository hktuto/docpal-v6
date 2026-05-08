<script lang="ts" setup>
import { useBatchDetailContext, type SectionWithValues, type FieldWithValue } from '#imports'
import { createValidator } from '../../../../types/formOCR'
import { ElMessageBox } from 'element-plus'

const props = defineProps<{
  section: SectionWithValues
  readonly?: boolean
  allData: SectionWithValues[]
}>()

const sectionContainerRef = ref()
const formSize = ref('default')
const emits = defineEmits<{
  fieldChange: [sectionId: string, fieldKey: string, value: any, rowIndex?: number]
  addRow: [sectionId: string]
  removeRow: [sectionId: string, rowIndex: number]
}>()
const noError = ref(true);
const context = useBatchDetailContext()
if (!context) {
  throw new Error('BatchDetailContext not found')
}

// Destructure for easier access
const { highlightedSection, highlightedField, selectSection, selectField,getCropImageBySection } = context

// Check if this section is currently highlighted
const isHighlighted = computed(() => {
  if (!highlightedSection.value) return false
  const sectionZone = getZoneString(props.section.zone)
  return highlightedSection.value.zone === sectionZone
})

// Check if a field is highlighted
function isFieldHighlighted(field: FieldWithValue) {
  if (!highlightedField.value) return false
  const fieldZone = getZoneString(field.zone)
  return highlightedField.value.zone === fieldZone
}

/**
 * Get zone string from zone object
 */
function getZoneString(zoneData: any): string | null {
  if (!zoneData) return null
  if (typeof zoneData === 'string') return zoneData
  if (typeof zoneData === 'object') return zoneData.zone
  return null
}

// Handle mouse enter for section - highlight persists until another is hovered
function handleSectionMouseEnter() {
  if (props.section.section_type !== 'table') {

  selectSection(props.section)
  // Clear field highlight when selecting a new section
  // selectField(null)
  }
}

// Handle field mouse enter - highlight persists until another is hovered
function handleFieldMouseEnter(field: FieldWithValue) {
  selectSection(props.section)
  selectField(field)
}

function handleTableFieldMouseEnter(field: FieldWithValue){

  selectField(field, props.section)
}

// Handle field value change
function handleFieldChange(field: FieldWithValue, value: any, rowIndex?: number) {
  emits('fieldChange', props.section.section_id, field.key, value, rowIndex)
}

// Handle add row for table sections
function handleAddRow() {
  emits('addRow', props.section.section_id)
}

// Handle remove row for table sections
async function handleRemoveRow(rowIndex: number) {

  const action = await ElMessageBox.confirm('Are you sure you want to remove this row?', 'Confirm', {
    confirmButtonText: 'Yes',
    cancelButtonText: 'No',
    type: 'warning',
  }).catch(action => action)
  if (action &&　action === 'confirm') {
    emits('removeRow', props.section.section_id, rowIndex)
  }
}

// Determine if field has been modified
function isFieldModified(field: FieldWithValue): boolean {
  if(!field.originalValue && !field.currentValue) return false
  return field.currentValue !== field.originalValue
}
function splitByCamelCase(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, '$1 $2')
}

// Generate validation rules for a field
function getFieldRules(field: FieldWithValue, index?:number): any[] {
  const rules: any[] = []

  // Required rule
  if (field.required) {
    rules.push({ required: true, message: 'Required', trigger: 'blur' })
  }

  // Custom validation function
  if (field.validation_function) {
    rules.push({
      validator: (rule: any, value: any, callback: any) => {
        const validatorFn = createValidator(field.validation_function)
        if(!props.section.fields) callback()
        // Build allData from section values for cross-field validation
        const allData = context.buildResultJson()
        validatorFn(rule, value, callback, allData, context.sectionsWithValues, index)
      },
      trigger: 'blur'
    })
  }

  return rules
}


// Get all field values for validation context
function getAllFieldValues(): Record<string, any> {
  if (props.section.section_type === 'table') {
    return {}
  }
  if(!props.section.fields) return {}
  return props.section.fields.reduce((acc, f) => {
    acc[f.key] = f.currentValue
    return acc
  }, {} as Record<string, any>)
}

// validate form
const sectionFormEl = ref()
const tabelSectionRef = ref()
async function validateForm() {

  try {
    if (sectionFormEl.value) {
        noError.value = await  sectionFormEl.value.validate((valid) => valid)
    }
    if (tabelSectionRef.value) {

      let result =  await Promise.all(tabelSectionRef.value.map(async (row) => {
        return await row.validate((valid) => valid)
      }))
      noError.value = result.every(Boolean)
    }
    return noError.value
  } catch (error) {
    console.error(error)
    return Promise.resolve(false)
  }

}

// Get input type for field
function getInputType(fieldType: string): string {
  const typeMap: Record<string, string> = {
    'text': 'text',
    'date': 'date',
    'hkic': 'text',
    'number': 'number',
    'email': 'email',
    'tel': 'tel'
  }
  return typeMap[fieldType] || 'text'
}

onMounted(() => {
  validateForm()
  if(props.section.save_to_result){
    getSectionImage()
  }
})

function checkDateisDOB(field:any, date:Date){

  const label = field.lable || field.label
  if(label.includes('DOB')){
    // check if data is before today
    return date > new Date()
  }

  return false
}

function getConstraintDate(constraint?: string): Date | null {
  if (!constraint) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  switch (constraint) {
    case 'today':
      return today
    case 'yesterday': {
      const d = new Date(today)
      d.setDate(d.getDate() - 1)
      return d
    }
    case 'one_week_ago': {
      const d = new Date(today)
      d.setDate(d.getDate() - 7)
      return d
    }
    default:
      return null
  }
}

function getDisabledDate(field: FieldWithValue, date: Date): boolean {
  if (checkDateisDOB(field, date)) return true

  const minDate = getConstraintDate(field.min_date)
  if (minDate && date < minDate) return true

  const maxDate = getConstraintDate(field.max_date || (field as any).mix_date)
  if (maxDate && date > maxDate) return true

  return false
}

function getInputFormatter(format?: string): ((value: string) => string) | undefined {
  switch (format) {
    case 'ALL_CAP':
      return (val: string) => {
        const v = val?.toUpperCase?.() || val
        return typeof v === 'string' ? v.trim() : v
      }
    case 'SMALL_CASE':
      return (val: string) => {
        const v = val?.toLowerCase?.() || val
        return typeof v === 'string' ? v.trim() : v
      }
    case 'TITLE_CASE':
      return (val: string) => {
        const v = val?.replace?.(/\w\S*/g, (txt: string) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase()) || val
        return typeof v === 'string' ? v.trim() : v
      }
    case 'NUMBER_ONLY':
      return (val: string) => {
        const v = val?.replace?.(/[^0-9]/g, '') || val
        return typeof v === 'string' ? v.trim() : v
      }
    default:
      return (val: string) => {
        const v = val
        return typeof v === 'string' ? v.trim() : v
      }
  }
}

function getInputParser(format?: string): ((value: string) => string) | undefined {
  switch (format) {
    case 'ALL_CAP':
      return (val: string) => {
        const v = val?.toUpperCase?.() || val
        return typeof v === 'string' ? v.trim() : v
      }
    case 'SMALL_CASE':
      return (val: string) => {
        const v = val?.toLowerCase?.() || val
        return typeof v === 'string' ? v.trim() : v
      }
    case 'TITLE_CASE':
      return (val: string) => {
        const v = val?.replace?.(/\w\S*/g, (txt: string) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase()) || val
        return typeof v === 'string' ? v.trim() : v
      }
    case 'NUMBER_ONLY':
      return (val: string) => {
        const v = val?.replace?.(/[^0-9]/g, '') || val
        return typeof v === 'string' ? v.trim() : v
      }
    default:
      return (val: string) => {
        const v = val
        return typeof v === 'string' ? v.trim() : v
      }
  }
}

// preview image logic
const previewImg = ref()
const previewImgLoading = ref(false)

async function getSectionImage(){

  previewImgLoading.value = true;
  previewImg.value = null;
  try{
    previewImg.value = await getCropImageBySection(props.section.zone)
  }catch(err){
    console.log("getSectionImage error", err)
  }finally{
    previewImgLoading.value = false;
  }
}
//
function focusSection(){
  nextTick(() => {
    const firstInput = sectionContainerRef.value?.querySelector('input, select, textarea')
    if (firstInput) {
      firstInput.focus()
    } else {
      sectionContainerRef.value?.focus()
    }
    // Highlight the first field in file preview
    if (props.section.section_type === 'table') {
      const firstField = props.section.rows?.[0]?.fields?.[0]
      if (firstField) {
        handleTableFieldMouseEnter(firstField)
      }
    } else {
      const fields = props.section.fields ? displayField(props.section.fields) : []
      const firstField = fields[0]
      if (firstField) {
        handleFieldMouseEnter(firstField)
      }
    }
  })
}
function displayField(fields: FieldWithValues) {
  return fields.filter((f) => !f.hidden )
}
watch(() => props.section,()=>{

  nextTick(() => {
    validateForm()
    if(props.section.save_to_result) {
      getSectionImage()
      const activeElement = document.activeElement;
      if(!activeElement || activeElement.tagName === 'BODY') {
        focusSection()
      }
      // focusSection()
    }
  })
},{
  deep:true
})



defineExpose({
  validateForm,
  focusSection
})


</script>

<template>
<div :class="{sectionHeader:true, highlighted: isHighlighted, error: !noError}" >
  <Icon name="lucide:layout-template" class="sectionIcon" />
  <span class="sectionName">{{ splitByCamelCase(section.section_name) }}</span>

  <ElTag v-if="section.zone?.page" :size="formSize" type="info">
    Page {{ section.zone.page }}
  </ElTag>

  <!-- Add row button for table sections - only show when not readonly -->
  <ElButton
    v-if="section.section_type === 'table' && !readonly"
    type="primary"
    :size="formSize"
    circle
    class="addRowBtn"
    tabindex="9999"
    @click.stop="handleAddRow"
  >
    <Icon name="lucide:plus" />
  </ElButton>
</div>
  <div
  ref="sectionContainerRef"
    :class="{ sectionContainer: true, highlighted: isHighlighted, error: !noError }"
    :tabindex="!section.save_to_result ? 999 : 0"
    @focus="handleSectionMouseEnter"
    @mouseenter="handleSectionMouseEnter"
  >
      <template v-if="section.save_to_result">
        <img v-loading="previewImgLoading" :src="previewImg" class="cropImgPreview" />
      </template>
    <!-- Standard Section -->
    <div v-if="section.section_type !== 'table'" class="fieldsList">
      <ElForm
        ref="sectionFormEl"
        :model="getAllFieldValues()"

        label-position="top"
        :size="formSize"
        class="section-form"
      >
        <ElFormItem
          v-for="field in displayField(section.fields)"
          :key="field.key"
          :prop="field.key"
          :rules="getFieldRules(field)"
          class="field-form-item"
        >
          <div
            class="fieldItem"
            :class="{ highlighted: isFieldHighlighted(field) }"
            @mouseenter="handleFieldMouseEnter(field)"
          >
            <div class="fieldLabel">
              <span class="labelText">{{ field.lable || field.label }}</span>
              <ElTag v-if="field.required" :size="formSize" type="danger" effect="plain" class="requiredTag">
                *
              </ElTag>
            </div>

            <!-- Select field with options -->
            <ElSelect
              v-if="field.options && field.options.length > 0"
              :model-value="field.currentValue"
              :size="formSize"
              :class="{fieldInput: true, edited: isFieldModified(field)}"

              :disabled="readonly"
              clearable
              filterable
              @focus="handleFieldMouseEnter(field)"
              @update:model-value="(val) => handleFieldChange(field, val)"
            >
              <ElOption
                v-for="opt in field.options"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </ElSelect>
            <template v-else-if="field.type === 'date'">
            <FormCustomDatePicker
                v-model="field.currentValue"
                 :class="{fieldInput: true, edited: isFieldModified(field)}"
                 :disabled="readonly"
                :format="field.format || 'DD/MM/YYYY'"
                :value-format="field.format || 'DD/MM/YYYY'"
                :disabled-date="(d) => getDisabledDate(field, d)"
                clearable
                placeholder="Enter date"
                @focus="handleFieldMouseEnter(field)"
                @update:model-value="(val) => handleFieldChange(field, val)"
            />
              <!-- <ElDatePicker
                :modelValue="field.currentValue"
                :size="formSize"



                :format="field.format || 'DD/MM/YYYY'"
                :value-format="field.format || 'DD/MM/YYYY'"
                 :disabled-date="(d) => getDisabledDate(field, d)"
                clearable

                @focus="handleFieldMouseEnter(field)"
                @update:model-value="(val) => handleFieldChange(field, val)"
              /> -->
              <!-- currentValue:{{field.currentValue}} -->
            </template>
            <!-- Regular text input -->
            <ElInput
              v-else
              :model-value="field.currentValue"
              :size="formSize"
              :class="{fieldInput: true, edited: isFieldModified(field), warning: field.warning }"
              :type="getInputType(field.type)"
              :formatter="getInputFormatter(field.format)"
              :parser="getInputParser(field.format)"
              :disabled="readonly"
              @focus="handleFieldMouseEnter(field)"
              @update:model-value="(val) => handleFieldChange(field, val)"
            />
            <div v-if="field.warning" class="warningText">{{ field.warning }}</div>

            <!-- Original OCR value display -->
            <div v-if="isFieldModified(field)" class="originalValue">
              <Icon name="lucide:history" class="originalIcon" />
              <span class="originalText">{{ field.originalValue || '(empty)' }}</span>
            </div>
          </div>
        </ElFormItem>
      </ElForm>
    </div>

    <!-- Table Section -->
    <div v-else class="tableSection">
      <div v-if="!section.rows || section.rows.length === 0" class="emptyTable">
        <ElEmpty :description="readonly ? 'No data rows.' : 'No data rows. Click + to add.'" :image-size="60" />
      </div>

      <div
        v-for="(row, rowIndex) in section.rows"
        :key="rowIndex"
        class="tableRow"
      >
        <div class="rowHeader">
          <Icon name="lucide:rows-3" class="rowIcon" />
          <span>Member {{ rowIndex + 1 }}</span>
          <!-- Remove row button - only show when not readonly -->
          <ElButton
            v-if="!readonly"
            type="danger"
            :size="formSize"
            circle
            class="removeRowBtn"
            tabindex="9999"
            @click.stop="handleRemoveRow(rowIndex)"
          >
            <Icon name="lucide:minus" />
          </ElButton>
        </div>

        <div class="rowFields">
          <ElForm
            :model="row.fields.reduce((acc, f) => {
              acc[f.key] = f.currentValue
              return acc
            }, {})"
            ref="tabelSectionRef"
            label-position="top"
            :size="formSize"
            class="row-form"
          >
            <ElFormItem
              v-for="field in row.fields"
              :key="field.key"
              :prop="field.label || field.lable || field.key"
              :rules="getFieldRules(field, rowIndex)"
              class="field-form-item"
            >
              <div
                class="fieldItem"
                :class="{ modified: field.currentValue !== field.originalValue }"
                @mouseenter="handleTableFieldMouseEnter(field)"
              >
                <div class="fieldLabel">
                  <span class="labelText">{{ field.lable || field.label }} ({{rowIndex + 1}})</span>
                  <ElTag v-if="field.required" :size="formSize" type="danger" effect="plain" class="requiredTag">
                    *
                  </ElTag>
                </div>

                <ElSelect
                  v-if="field.options && field.options.length > 0"
                  :model-value="field.currentValue"
                  :size="formSize"
                  class="fieldInput"
                  filterable
                  clearable
                  :disabled="readonly"
                  @focus="handleTableFieldMouseEnter(field)"
                  @update:model-value="(val) => handleFieldChange(field, val, rowIndex)"
                >
                  <ElOption
                    v-for="opt in field.options"
                    :key="opt.value"
                    :label="opt.label"
                    :value="opt.value"
                  />
                </ElSelect>

                <template v-else-if="field.type === 'date'">
                    <FormCustomDatePicker
                    :modelValue="field.currentValue"
                    :format="field.format || 'DD/MM/YYYY'"
                    :value-format="field.format || 'DD/MM/YYYY'"
                    :disabled="readonly"
                    :disabled-date="(d) => getDisabledDate(field, d)"
                    placeholder="Enter date"
                    @update:model-value="(val) => handleFieldChange(field, val, rowIndex)"
                  />
                  <!-- <ElDatePicker
                    :modelValue="field.currentValue"
                    :size="formSize"
                    :class="{fieldInput: true, edited: isFieldModified(field)}"
                    clearable
                    :disabled="readonly"
                    :format="field.format || 'DD/MM/YYYY'"
                    :value-format="field.format || 'DD/MM/YYYY'"
                    :disabled-date="(d) => getDisabledDate(field, d)"
                    @focus="handleTableFieldMouseEnter(field)"
                    @update:model-value="(val) => handleFieldChange(field, val, rowIndex)"
                  /> -->
                  <!-- currentValue:{{field.currentValue}} -->
                </template>

                <ElInput
                  v-else
                  :model-value="field.currentValue"
                  :size="formSize"
                  :class="{fieldInput:true, warning: field.warning}"
                  :type="getInputType(field.type)"
                  :formatter="getInputFormatter(field.format)"
                  :parser="getInputParser(field.format)"
                  :disabled="readonly"
                  @focus="handleTableFieldMouseEnter(field)"
                  @update:model-value="(val) => handleFieldChange(field, val, rowIndex)"
                />
                <div v-if="field.warning" class="warningText">{{ field.warning }}</div>

                <!-- Original OCR value display -->
                <div v-if="isFieldModified(field)" class="originalValue">
                  <Icon name="lucide:history" class="originalIcon" />
                  <span class="originalText">{{ field.originalValue || '(empty)' }}</span>
                </div>
              </div>
            </ElFormItem>
          </ElForm>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.cropImgPreview{
    width:100%;

}
.warningText{
  color: var(--app-warning-color);
}
.sectionContainer {

  width: 100%;
  min-height: 100px;
  border: 1px solid var(--app-border-color);
  border-top: none;
  border-radius: var(--app-radius-m);
  overflow: hidden;
  background-color: var(--app-bg-color);
  transition: all 0.2s ease;
  flex-shrink: 0;
  margin-bottom: var(--app-space-s);
  border-bottom-left-radius: var(--app-border-radius-s);
  border-bottom-right-radius: var(--app-border-radius-s);
  :deep(.el-input){
      width: 100%;
  }
  &:hover,
  &.highlighted {
    border-color: var(--app-primary-color);
    box-shadow: 0 0 0 1px var(--app-primary-color-light);
  }
  &.error{
      border-color: var(--app-error-color) !important;
  }

}

.sectionHeader {
    position: sticky;

    top: 0;
    width:100%;
    background: #fff;
    border: 1px solid var(--app-border-color);
    border-bottom: none;
  display: flex;
  align-items: center;
  gap: var(--app-space-xs);
  padding: var(--app-space-s) var(--app-space-m);
  font-weight: 600;
  font-size: var(--app-font-size-m);
  z-index:2;
  border-top-left-radius: var(--app-border-radius-s);
  border-top-right-radius: var(--app-border-radius-s);
  &.highlighted {

      border: 1px solid var(--app-primary-color);
  }
  &.error{
      color: var(--app-error-color) !important;
      border-color: var(--app-error-color) !important;
  }
  &:after{
      content: "";
      position: absolute;
      left: -10%;
      width:120%;
      height: 40px;
      top: -41px;
      z-index: -1;
      background: linear-gradient( to top, var(--app-grey-950), rgba(255,255,255,0));
  }
}

.sectionIcon {
  font-size: 16px;
}

.sectionName {
  flex: 1;
}

.addRowBtn {
  margin-left: auto;
}

.removeRowBtn {
  margin-left: auto;
}

.fieldsList {
  padding: var(--app-space-s);
  display: flex;
  flex-flow: column nowrap;
  gap: var(--app-space-s);
}

.fieldItem {
  display: flex;
  flex-flow: column nowrap;
  gap: var(--app-space-xs);
  padding: var(--app-space-xs);
  border-radius: var(--app-radius-s);
  transition: all 0.15s ease;
  position: relative;
  &:hover,
  &.highlighted {
    background-color: var(--app-primary-color-light);
    &:before{
      content: '';
      position: absolute;
      left: -3px;
      top: 0;
      width: 2px;
      height: 100%;
      background: var(--app-warning-color);
    }
    /* padding-left: calc(var(--app-space-xs) - 3px); */
  }

}

.fieldLabel {
  display: flex;
  align-items: center;
  gap: var(--app-space-xs);
  font-size: var(--app-font-size-s);
  color: var(--app-text-color-secondary);
}

.labelText {
  flex: 1;
}

.requiredTag {
  font-weight: bold;
}

.fieldInput {
  width: 100%;
  &.edited{
    :deep(.el-input__wrapper), :deep(.el-select__wrapper){
      border: 1px solid var(--app-primary-color);
    }
  }
  &.warning {
    :deep(.el-input__wrapper), :deep(.el-select__wrapper){
      border: 1px solid var(--app-warning-color);
    }
  }
}

.originalValue {
  display: flex;
  align-items: center;
  gap: var(--app-space-xs);
  font-size: var(--app-font-size-s);
  color: var(--app-text-color-secondary);
  padding: var(--app-space-xs);
  background-color: var(--app-bg-color-secondary);
  border-radius: var(--app-radius-s);

  .originalIcon {
    font-size: 12px;
  }

  .originalText {
    text-decoration: line-through;
    opacity: 0.7;
  }
}

// Table styles
.tableSection {
  padding: var(--app-space-s);
}

.emptyTable {
  padding: var(--app-space-m);
}

.tableRow {
  border: 1px solid var(--app-border-color);
  border-radius: var(--app-radius-s);
  margin-bottom: var(--app-space-s);
  overflow: hidden;

  &:last-child {
    margin-bottom: 0;
  }
}

.rowHeader {
  display: flex;
  align-items: center;
  gap: var(--app-space-xs);
  padding: var(--app-space-xs) var(--app-space-s);
  background-color: var(--app-bg-color-secondary);
  font-size: var(--app-font-size-s);
  font-weight: 500;
}

.rowIcon {
  font-size: 14px;
}

.rowFields {
  padding: var(--app-space-xs);
  display: flex;
  flex-flow: column nowrap;
  gap: var(--app-space-xs);
}

.section-form,
.row-form {
  width: 100%;
}

.field-form-item {
  margin-bottom: 0;
  &.is-error{
      margin-bottom: var(--app-space-s);
  }
}

.field-form-item :deep(.el-form-item__content) {
  display: block;
}

.field-form-item :deep(.el-form-item__error) {
  padding-top: 2px;
}
</style>

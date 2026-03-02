<script lang="ts" setup>
import { globalApi } from 'api';
import { ElFormItem } from 'element-plus';
import {CONDITION_PROVIDER} from '#imports'
const {element} = defineProps<{
    element:any
}>()
const graphProvider = inject(BPMN_PROVIDER)
const editorProvider = inject(EDITOR_PROVIDER);
const conditionProvider = inject(CONDITION_PROVIDER)
if(!graphProvider || !editorProvider || !conditionProvider) {
    throw createError('provider not found')
}
const { bpmnGlobalRules } = editorProvider.BpmnRule

const typeOptions = computed(() => {
    if(!editorProvider.conditionSetting.value) return []
    return editorProvider.conditionSetting.value.map((item:any) => {
        return {
            label: item.type,
            value: item.type
        }
    })
})


const emits = defineEmits(['delete', 'update'])

const form = ref<{
    attr_type:string,
    attr_source:string,
    attr_fieldName:string,
    attr_condition:string,
    attr_target:string,
    attr_targetValue:any
    attr_validataInfo?:string
    compareValue?:any
}>({
    attr_type:"",
    attr_source:"form",
    attr_fieldName:"",
    attr_condition:"",
    attr_target:"",
    attr_targetValue:""
})

const rules = reactive({
    attr_type:[
        { required: true, message: 'Please select a type', trigger: 'change' }
    ],
    attr_fieldName:[
        { required: true, message: 'Please input field name', trigger: 'change' }
    ],
    attr_condition:[
        { required: true, message: 'Please select a condition', trigger: 'change' }
    ],
})


const selectedType = computed(() => {
    if(!form.value.attr_type || !editorProvider.conditionSetting) return null;
    return editorProvider.conditionSetting.value.find((item:any) => item.type === form.value.attr_type)
})

const conditionOption = computed(() => {
    if(!selectedType.value) return [];
    return selectedType.value.validation
}) 

function typeChange(value:string) {
    if(selectedType.value){
        form.value.attr_condition = selectedType.value.validation[0].value
        if(selectedType.value.type === 'is_null'){
            form.value.attr_targetValue = "isNull";
        }
        if(selectedType.value.target.type === 'boolean'){

            form.value.attr_targetValue = true;
        }else{
            form.value.attr_targetValue = "";
        }
        // ignore masterTable and cast to change attr_target
        if(!['Match_Master_Table', 'Match_Case_Info', 'Compare_Case_Info'].includes(value)) {
            form.value.attr_target = selectedType.value.target.type
        }else{
            form.value.attr_target = "";
        }
    }
}

const allFields = computed(() => {
  if (!bpmnGlobalRules.value || bpmnGlobalRules.value.length === 0) return []

  return bpmnGlobalRules.value
})

const masterTableLoading = ref(false)
const selectedMasterTableOption = ref<any[]>([])
async function masterTableChange(masterTableId:string) {
    masterTableLoading.value = true
    const data = await globalApi.getDmsMasterTableId(masterTableId).then(r=>r.data)
    if(!!data && data.fields){
        selectedMasterTableOption.value = data.fields
    }else{
        selectedMasterTableOption.value = []
    }
    masterTableLoading.value = false
}

const castColumnLoading = ref(false)
const selectedCaseTableOption = ref<any[]>([])
async function caseTableChange(caseTableId:string) {
    castColumnLoading.value = true
    const data = await globalApi.getCaseTablesId(caseTableId).then(r =>r.data)
    console.log("caseTableChange", data)
    if(!!data && data.fields){
        selectedCaseTableOption.value = data.fields
    }else{
        selectedCaseTableOption.value = []
    }
    castColumnLoading.value = false
}


watch(() => element, () => {
    if(JSON.stringify(form.value) !== JSON.stringify(element)) {
        form.value =  JSON.parse(JSON.stringify(element))
        if(element.attr_type === 'Match_Case_Info' && element.attr_target) {
            caseTableChange(element.attr_target)
        }
        if(element.attr_type === 'Compare_Case_Info' && element.attr_target) {
            caseTableChange(element.attr_target)
        }
        if(element.attr_type === 'Match_Master_Table' && element.attr_target) {
            masterTableChange(element.attr_target)
        }
    }
    
},{
    immediate: true,
    deep: true
})

watch(form, () => {
    // if form and different from element, emit update
    if(JSON.stringify(form.value) !== JSON.stringify(element)) {
        emits('update', JSON.parse(JSON.stringify(form.value)))
    }
},{
    deep:true
})


</script>

<template>
    <div class="elementContainer">
        <div v-if="!editorProvider.readonly.value" class="removeConditionContainer">
            <Icon name="lucide:trash" @click="$emit('delete')" />
        </div>
        <ElForm :model="form" :rules="rules" label-position="top" size="small" @submit.stop>
            <ElFormItem label="Type" prop="attr_type">
                <ElSelect v-model="form.attr_type" placeholder="Select form field" :disabled="editorProvider.readonly.value"   filterable clearable @change="typeChange">
                    <ElOption v-for="item in typeOptions" :key="item.value" :label="item.label" :value="item.value"></ElOption>
                </ElSelect>
            </ElFormItem>
            <ElFormItem label="Field" prop="attr_fieldName">
                <ElSelect v-model="form.attr_fieldName" placeholder="Select form field" :disabled="editorProvider.readonly.value"  filterable clearable>
                    <ElOption v-for="item in allFields"  :key="item.id" :label="item.name" :value="item.id" />
                </ElSelect>
            </ElFormItem>
            <ElFormItem label="Condition" prop="attr_condition">
                <ElSelect v-model="form.attr_condition" placeholder="Select form field" :disabled="editorProvider.readonly.value"  filterable clearable>
                    <ElOption v-for="condition in conditionOption" :key="condition.value" :label="condition.label" :value="condition.value"></ElOption>
                </ElSelect>
            </ElFormItem>
            <template v-if="selectedType">
              <template v-if="selectedType.target.type === 'is_null'">
                <ElFormItem  label="Condition Value" prop="attr_targetValue" required>
                    <ElSelect v-model="form.attr_targetValue" filterable placeholder="Select" :disabled="editorProvider.readonly.value" >
                        <ElOption v-for="item in ['isNull', 'notNull']" :key="item" :label="item" :value="item" />
                    </ElSelect>
                </ElFormItem>
              </template>
                <template v-if="selectedType.target.type === 'boolean'" >
                    <ElFormItem  label="Condition Value" prop="attr_targetValue" required>
                        <ElSwitch v-model="form.attr_targetValue" active-text="True" inactive-text="False" :disabled="editorProvider.readonly.value"  />
                    </ElFormItem>
                </template>
                <template v-else-if="selectedType.target.type === 'string'">
                    <ElFormItem  label="Condition Value" prop="attr_targetValue">
                        <ElInput v-model="form.attr_targetValue" :disabled="editorProvider.readonly.value" />
                    </ElFormItem>
                </template>
                <template v-else-if="selectedType.target.type === 'number'">
                    <ElFormItem  label="Condition Value" prop="attr_targetValue" required>
                        <ElInputNumber v-model="form.attr_targetValue" :disabled="editorProvider.readonly.value" />
                    </ElFormItem>
                </template>
                <template v-else-if="selectedType.target.type === 'userGroup'">
                    <ElFormItem  label="User Group" prop="attr_targetValue" required>
                        <ElSelect v-model="form.attr_targetValue" filterable placeholder="Select" :disabled="editorProvider.readonly.value" >
                            <ElOption v-for="item in conditionProvider.userGroupOption.value" :key="item.id" :label="item.name" :value="item.id" />
                        </ElSelect>
                    </ElFormItem>
                </template>
                <template v-else-if="selectedType.target.type === 'masterTable'">
                    <ElFormItem  label="Master Table" prop="attr_target" required>
                        <ElSelect v-model="form.attr_target" filterable placeholder="Select" @change="masterTableChange" :disabled="editorProvider.readonly.value" >
                            <ElOption v-for="item in conditionProvider.masterTableOption.value" :key="item.id" :label="item.name" :value="item.id" />
                        </ElSelect>
                    </ElFormItem>
                    <ElFormItem label="Master Table Column" prop="attr_targetValue" required>
                        <ElSelect v-model="form.attr_targetValue" filterable placeholder="Select" :disabled="editorProvider.readonly.value" >
                            <ElOption v-for="item in selectedMasterTableOption" :key="item.columnName" :label="item.columnName" :value="item.columnName" />
                        </ElSelect>
                    </ElFormItem>
                </template>
                <template v-else-if="selectedType.type === 'Match_Case_Info'">
                    <ElFormItem  label="Case Table" prop="attr_target" required>
                        <ElSelect v-model="form.attr_target" filterable placeholder="Select" :disabled="editorProvider.readonly.value"  @change="caseTableChange" >
                            <ElOption v-for="item in conditionProvider.caseTableOption.value" :key="item.id" :label="item.tableName" :value="item.id" />
                        </ElSelect>
                    </ElFormItem>
                    <ElFormItem label="Case Table Column" prop="attr_targetValue" required>
                        <ElSelect v-model="form.attr_targetValue" filterable placeholder="Select" :disabled="editorProvider.readonly.value" >
                            <ElOption v-for="item in selectedCaseTableOption" :key="item.columnName" :label="item.columnName" :value="item.columnName" />
                        </ElSelect>
                    </ElFormItem>
                </template>
                <template v-else-if="selectedType.type === 'Compare_Case_Info'">
                    <ElFormItem  label="Case Table" prop="attr_target" required>
                        <ElSelect v-model="form.attr_target" filterable placeholder="Select" :disabled="editorProvider.readonly.value"  @change="caseTableChange">
                            <ElOption v-for="item in conditionProvider.caseTableOption.value" :key="item.id" :label="item.tableName" :value="item.id" />
                        </ElSelect>
                    </ElFormItem>
                    <ElFormItem label="Case Table Column" prop="attr_targetValue" required>
                        <ElSelect v-model="form.attr_targetValue" filterable placeholder="Select" :disabled="editorProvider.readonly.value" >
                            <ElOption v-for="item in selectedCaseTableOption" :key="item.columnName" :label="item.columnName" :value="item.columnName" />
                        </ElSelect>
                    </ElFormItem>
                    <ElFormItem label="Compare Column" prop="attr_validataInfo" required>
                        <ElSelect v-model="form.attr_validataInfo" filterable placeholder="Select" :disabled="editorProvider.readonly.value" >
                            <ElOption v-for="item in selectedCaseTableOption" :key="item.columnName" :label="item.columnName" :value="item.columnName" />
                        </ElSelect>
                    </ElFormItem>
                    <template v-if="!['isEmpty', 'notEmpty'].includes(form.attr_condition)">

                        <ElFormItem label="Compare Value" prop="attr_targetValue" required>
                            <template v-if="['greater', 'smaller'].includes(form.attr_condition)">
                                <ElInputNumber v-model="form.compareValue" :disabled="editorProvider.readonly.value" />
                            </template>
                            <template v-else>
                                <ElInput v-model="form.compareValue"  :disabled="editorProvider.readonly.value" />
                            </template>
                        </ElFormItem>
                    </template>
                </template>
            </template>
            
                
        </ElForm>
    </div>

</template>

<style scoped lang="scss">
.elementContainer{
    width: 100%;
    position: relative;
}
:deep(.el-form-item--small){
    margin-bottom: var(--app-space-xs);
}
:deep(.el-form-item__label){
    margin-bottom: var(--app-font-size-xxs);
}
:deep(.el-input-number--small){
    width: 100%;
}
.removeConditionContainer{
    position: absolute;
    top: var(--app-space-xs);
    right: var(--app-space-xs);
    cursor: pointer;
    font-size: var(--app-font-size-s);
}
</style>

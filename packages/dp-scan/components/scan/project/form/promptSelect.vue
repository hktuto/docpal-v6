<script lang="ts" setup>
import { clientApi } from 'api'
import PromptDialog from './promptDiaglog.vue'
const modelValue = defineModel('modelValue',{
  required: true,
})

const localModel = computed({
  get(){
    return modelValue.value
  },
  set(val){
    modelValue.value = val
  }
})

const allTemplates = useState<{id:string, name:string}[]>('allPromptList',() => ([]))

// ===================== prmopt template related =============
async function getTemplateList(){
  const {data:list} = await clientApi.api.getCapturePrompttemplatesettingList()
  allTemplates.value = list as {id:string, name:string}[]
}

/// ======================= edit create logic and state =======
const dialogRef = ref();
const containerRef = ref() // the container ref
function startEdit(temp:any){
  dialogRef.value.open(containerRef.value, localModel.value)
}

function startCreate(){
  dialogRef.value.open(containerRef.value)
}

async function handleCreateSuccess(newId:string){
  await getTemplateList()
  localModel.value = newId
}

onMounted(() =>{
  if(!allTemplates.value.length) {
    getTemplateList()
  }
})

</script>


<template>
    <div ref="containerRef" class="templateSelectContainer">

    <ElSelect v-model="localModel">
        <ElOption v-for="temp in allTemplates" :key="temp.id" :value="temp.id" :label="temp.name" />
    </ElSelect>
    <ElButton type="success" :disabled="!localModel" @click="startEdit" >Edit</ElButton>
    <ElButton type="primary" @click="startCreate">Create</ElButton>
    <PromptDialog ref="dialogRef" @created="handleCreateSuccess" />
    </div>
</template>

<style lang="scss" scoped>
.templateSelectContainer{
    width: 100%;
    display: grid;
    grid-template-columns: 1fr min-content min-content;
    gap: var(--app-space-xs);
    .el-button{
     margin: 0;
    }
}

</style>

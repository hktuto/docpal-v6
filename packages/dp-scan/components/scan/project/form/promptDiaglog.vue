<script lang="ts" setup>
import { clientApi} from 'api'



const defaultForm = {
  name: "",
  promptTemplate: "",
}
const temp = ref<{
  id?:string,
  name: string,
  promptTemplate: string
}>({
  ...defaultForm
});
const dialogRef = ref<any>(null);

const isNew = ref(false)
const loading = ref(false)
const formRef = ref()
const rules = reactive({
  name: [
    { required: true, message: "Please enter a name", trigger: "blur" },
  ],
  promptTemplate: [
    { required: true, message: "Please enter a prompt template", trigger: "blur" },
  ],
})
const routerProvider = inject(MenuRouterKey)
const emit = defineEmits(['created'])
async function getTemplateDetail(tempId:string){
  if(!tempId) return;
  loading.value = true;
  try {
    const res = await clientApi.api.getCapturePrompttemplatesettingId(tempId) as any
    if(!res || !res.data) throw new Error('api fail');
    temp.value = {
      id: res.data.id,
      name: res.data.name,
      promptTemplate: res.data.promptTemplate
    }

  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
}
function open( el: HTMLElement,tempId?:string,){
  temp.value = {...defaultForm};
  if(!tempId){
    isNew.value = true;
  }else{
    getTemplateDetail(tempId);
    isNew.value = false;
  }
  dialogRef.value?.open(el);
}
function close(){
  temp.value = null;
  dialogRef.value?.close();
}

async function save() {
  //TODO: implement save and creat logic
  loading.value = true;
  try{
    const valid = await formRef.value.validate()
    if(!valid) throw new Error('validation failed');
    const updatedTempResponse = await clientApi.api.postCapturePrompttemplatesetting({
      ...temp.value
    })
    routerProvider?.message.success(isNew ? "New Template Created" : "Template Updated")
    if(isNew) emit('created', updatedTempResponse.data)
    close()
  }catch(error) {
    if(error instanceof Error) {
      routerProvider?.message.error(error.message)
    }
  }finally{
    loading.value = false;
  }
}


defineExpose({ open, close });

</script>

<template>
    <UiPopoverDialog ref="dialogRef" ">

        <ElForm ref="formRef" v-loading="loading" :model="temp" label-position="top" :rules="rules">
            <ElFormItem label="Name">
                <ElInput v-model="temp.name" prop="name" />
            </ElFormItem>
            <ElFormItem label="Prompt Template">
                <ElInput type="textarea" :rows="10" v-model="temp.promptTemplate" prop="promptTemplate" />
            </ElFormItem>
            <ElFormItem>
                <ElButton type="info" @click="close">Cancel</ElButton>
                <ElButton type="primary" @click="save">{{isNew ? 'Update' : 'Save'}}</ElButton>
            </ElFormItem>
        </ElForm>
    </UiPopoverDialog>
</template>

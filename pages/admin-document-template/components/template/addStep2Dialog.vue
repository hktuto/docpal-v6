<template>
<el-dialog 
    class="scroll-dialog"
    v-model="state.visible" :title="$t('template.create')"
    :close-on-click-modal="false" append-to-body
    >
    <FormUpload v-model="form.fileList" :limit="1" :accept="state.accept"></FormUpload>
    <template #footer>
        <el-button v-if="state.setting && state.setting.fileType !== 'PDF'" type="primary" :loading="state.loading" @click="goOffice">{{$t('template.createInOffice')}}</el-button>
        <el-button type="primary" :loading="state.loading" @click="handleSubmit">{{$t('smartFolder_create')}}</el-button>
    </template>
</el-dialog>
</template>
<script lang="ts" setup>
import { adminApi,clientApi } from 'api'
const emits = defineEmits([
    'refresh'
])
const state = reactive({
    loading: false,
    visible: false,
    accept: '',
    setting: {},
})
const form = reactive({
    fileList: []
})
async function handleSubmit() {
    if(form.fileList.length === 0) {
        state.visible = false
        return
    }
    const file = form.fileList[0]
    try {
        state.loading = true
        const formData = new FormData()
        formData.append('file', file)
        formData.append('id', state.setting.id)
        await clientApi.admin.putAdmindmsTemplateDocumentUpload({requestDTO:{}},formData as any)
        state.visible = false
    } catch (error) {
    }
    state.loading = false
}
async function handleOpen(setting) {
    state.visible = true
    state.setting = setting
    state.accept = ExtensionMap[setting.fileType]
    form.fileList = []
}

async function goOffice(docId:any){
    if(!docId) docId = state.setting.documentId
    const token = await adminApi.api.getGetofficetokenId(docId).then(r => r.data)
    const baseUrl = officeUrl(docId, token)
    state.visible = false
    // const baseUrl = `https://office.app4.wclsolution.com/browser/85ac843/cool.html?WOPISrc=https://app4.wclsolution.com/api/wopi/files/${props.doc.id}?access_token=${token}`
    window.open(baseUrl, '_blank')
}
function officeUrl(docId:string, token:string) {
    const host = window.location.host;
    if(!host.includes('localhost')){
        return `https://office.${host}/browser/85ac843/cool.html?WOPISrc=https://office.${host}/wopi/files/${docId}?access_token=${token}`
    }else{
        return `https://office.app4.wclsolution.com/browser/85ac843/cool.html?WOPISrc=https://office.app4.wclsolution.com/wopi/files/${docId}?access_token=${token}`
    }
}
defineExpose({ handleOpen, goOffice })
</script>
<style lang="scss" scoped>

</style>

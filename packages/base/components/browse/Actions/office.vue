<template>
  <BrowseActionsButton id="officeActionButton" :label="$t('tip.office')" @click="goOffice">
    
    <SvgIcon src="/icons/file/office.svg" round :content="$t('tip.office')"
                ></SvgIcon>
  </BrowseActionsButton>
  <el-dialog v-model="state.dialogOpened" :show-close="false" :close-on-click-modal="false">
        <div class="closeCollaboraText">
            {{$t('tip.closeCollabora')}}
        </div>
        <template #footer>
            <el-button @click="handleClose">{{$t('common_close')}}</el-button>
        </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { clientApi } from 'api'
const {public:{OFFICE_END_POINT}} = useRuntimeConfig()
const userPreference = useUserPreference()

const props = defineProps<{
    doc: any
}>()
const emits = defineEmits([
    'refresh'
])
const state = reactive({
    dialogOpened: false
})
async function goOffice(){
  const token = await clientApi.api.getGetofficetokenId(props.doc.id,{
    fileType:'NUXEO'
  }).then(r => r.data)
    state.dialogOpened = true
    const baseUrl = officeUrl(props.doc.id, token)
    // const baseUrl = `https://office.app4.wclsolution.com/browser/85ac843/cool.html?WOPISrc=https://app4.wclsolution.com/api/wopi/files/${props.doc.id}?access_token=${token}`
    window.open(baseUrl, '_blank')
}
const officeUrl = (docId:string, token:string) =>{
    const WOPISrc = `https://${OFFICE_END_POINT}/wopi/files/${docId}?fileType=NUXEO&readonly=false&access_token=${token}`
    return `https://${OFFICE_END_POINT}/browser/85ac843/cool.html?lang=${userPreference.value.language.replaceAll('HK', "TW")}&WOPISrc=${encodeURIComponent(WOPISrc)}`;
    // if(!host.includes('localhost')){
    //     return `https://office.${host}/browser/85ac843/cool.html?WOPISrc=https://office.${host}/wopi/files/${docId}?access_token=${token}`
    // }else{
    //     return `https://office.app4.wclsolution.com/browser/85ac843/cool.html?WOPISrc=https://office.app4.wclsolution.com/wopi/files/${docId}?access_token=${token}`
    // }
}
function handleClose() {
    state.dialogOpened = false
    emits('refresh')
}
</script>
<style lang="scss" scoped>
.closeCollaboraText {
    text-align: center;
    padding-top: var(--app-space-xs);
    font-size: 24px;
    font-weight: bold;
    line-height: 22px;
    letter-spacing: 0px;
        
    font-feature-settings: "kern" on;
    color: #9E9E9E;
}
</style>

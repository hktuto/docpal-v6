<script lang="ts" setup>
import { clientApi } from 'api';
const docTypeData = ref()
const { documentType } = defineProps<{
    documentType: string
}>()

onMounted(async() => {
    const {data:metaSettingData} = await clientApi.admin.getAdmindmsSettingSystem('');
    if(metaSettingData && metaSettingData[documentType]) {
        docTypeData.value = {
            ...metaSettingData[documentType],
            name: documentType
        }
    }
})

</script>

<template>
    <div class="pageContainer">
        <div class="metaSetting-container">
            <BulkImportInfo :docType="docTypeData" :name="documentType"></BulkImportInfo>
            <BulkImportMetaMapping :docType="docTypeData" :name="documentType"></BulkImportMetaMapping>
            <BulkImportConfig :name="documentType" />
        </div>
    </div>
</template>

<style lang="scss" scoped>
.pageContainer{
    width: 100%;
    height: 100%;
    position: relative;
    padding: var(--app-space-xs);
    overflow: hidden;

}
.metaSetting-container {
    display: grid;
    grid-template-columns: minmax(min-content, 200px) 1fr 1fr;
    gap: var(--app-space-xs);
    height: 100%;
    overflow: hidden;
    @container (max-width: 700px) {
        grid-template-columns: 1fr;
    }
    @media (max-width: 700px) {
        grid-template-columns: 1fr;
    }
}
</style>
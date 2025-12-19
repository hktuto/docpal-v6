<template>
<el-dialog v-model="state.dialogVisible" class="reader-dialog big"
    append-to-body destroy-on-close>
    <template #header>
        <div class="flex-x-between">
            <div>{{name}}</div>
            <div style="padding: 0 var(--app-space-xs)">
                <slot name="header"></slot>
            </div>
        </div>
    </template>
    <div class="reader-dialog-main" v-loading="loading">
        <Reader v-if="!collabora" ref="ReaderRef" v-bind="props" ></Reader>
        <CollaboraViewer v-else :editable="false" :doc-id="id" fileType="WORKFLOW" readonly ></CollaboraViewer>
    </div>

    <template #footer>
        <!-- <el-button v-if="!loading && blob && !_options.noDownload"  :icon="Download" @click="handleDownload">{{$t('download')}}</el-button> -->
        <slot name="actions"></slot>
    </template>
</el-dialog>
</template>

<script lang="ts" setup>
import { Picture as IconPicture, Download } from '@element-plus/icons-vue'

const emits = defineEmits(['download'])
export type readerOptions = {
    noDownload?: Boolean,
    print: false,
    loadAnnotations: false,
}
const props = withDefaults(defineProps<{
    id?: string,
    blob?: Blob,
    name: string,
    collabora: boolean,
    annotations?: Array,
    loading: boolean,
    options: readerOptions
}>(), {
    name:"",
    collabora: false,
    loading: false,
    options:{
        print: false,
        loadAnnotations: false,
    }
})
const _options = computed<readerOptions>(() => {
    const option = {
        noDownload: false
    }
    return Object.assign(option, props?.options)
})
const state = reactive({
    dialogVisible: false
})
function handleOpen() {
    state.dialogVisible = true
}
function handleClose() {
    state.dialogVisible = false
}
const ReaderRef = ref()
function handleDownload() {
    ReaderRef.value.handleDownload()
}
onMounted(() => {


})
defineExpose({ handleOpen, handleClose })
</script>

<style scoped lang="scss">
</style>
<style lang="scss">
.reader-dialog {
    --el-dialog-margin-top: var(--app-space-xs) !important;
    --el-dialog-width: calc(100vw - 2 * var(--app-space-xs)) !important;
    height: calc( 100vh - 2 * var(--app-space-xs) - 50px);
    // max-width: 1024px;
    max-height: 1024px;
    display: grid;
    grid-template-rows: min-content 1fr min-content;
    &-main{
        width: 100%;
        height: 100%;
        margin: auto;
        overflow: hidden;
        display: flex;
        justify-content: center;
        align-items: center;
    }
    .el-dialog__body{
        overflow: auto;
        display: flex;
        padding: var(--app-space-xs) var(--el-dialog-padding-primary);
    }
}
</style>

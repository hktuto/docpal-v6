<template>
<div v-if="state.doc!.name">
    <div class="flex-x-between">
        <h2>{{state.doc.name}}</h2>
        <el-button type="primary"
            @click="handleApplyToSelected">{{$t('Apply.to.Selected')}}</el-button>
    </div>
    <main>
        <div class="row-item">
            <div class="row-item-top">
                <span class="color__danger">*</span>
                    {{$t('dpDocument_fileType')}}
            </div>
            <el-select v-model="state.doc.documentType" filterable default-first-option
                @change="handleDocTypeChange(state.doc)">
                <el-option v-for="item in state.fileTypes" :key="item.name" :value="item.name" :label="$t(item.name)"></el-option>
            </el-select>
        </div>
        <MetaRenderForm2 ref="MetaFormRef" @formChange="handleMetaChange"></MetaRenderForm2>
    </main>
</div>
<div v-else class="flex-center">
    {{$t('Click document to setting')}}
</div>
</template>

<script lang="ts" setup>
import { newClientApi} from 'api'
const props = withDefaults(defineProps<{
    checkList: any,
}>(), {
    checkList: []
})
const state = reactive({
    doc: {
    },
    ready: false,
    fileTypes: []
})
const emit = defineEmits(['apply-to-selected'])
const MetaFormRef = ref()
async function handleApplyToSelected() {
    emit('apply-to-selected', {
        documentType: state.doc.documentType,
        properties: deepCopy(state.doc.properties),
        isFolder: state.doc.isFolder
    })
}
async function handleDocTypeChange (doc) {
    getMetaAndSetMeta()
}
// #region module: 初始化
    async function init(doc: any) {
        state.doc = doc
        getDocType(state.doc.isFolder)
        getMetaAndSetMeta()
    }
    async function getDocType(isFolder) {
        const res = await newClientApi.getDmsDocpalTypeActive()
                                .then(res => res.data)
                                .then(data => data.sort((a,b)=> (a.name.localeCompare(b.name) ))) as any
        state.fileTypes = res.filter((item) => item.isFolder === isFolder)
    }
    function getMetaAndSetMeta() {
        state.ready = false
        nextTick(async() => {
            await MetaFormRef.value.init(state.doc.documentType)
            MetaFormRef.value.setData(state.doc.properties)
            setTimeout(()=> { state.ready = true }, 1000)
        })
    }
// #endregion
function handleMetaChange(data) {
    if(state.ready) {
        state.doc.properties = deepCopy(data.formModel)
    }
}
async function validate(nodeMapData) {
    // const tableData = Object.values(nodeMapData)
    return true
}
defineExpose({
    init, validate
})
</script>

<style lang="scss" scoped>
h2 {
    margin: unset;
}
.flex-center {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
}
.row-item {
    display: grid;
    grid-template-columns: 1fr min-content;
    grid-template-rows: min-content min-content;
    grid-column-gap: var(--app-space-xs);
    &-top {
        padding: var(--app-space-xs) 0;
        grid-area: 1 / 1 / 2 / 3;
    }
    &-bottom-left { grid-area: 2 / 1 / 3 / 2; }
    &-bottom-right {
        grid-area: 2 / 2 / 3 / 3;
        min-width: 1px;
    }
}
</style>

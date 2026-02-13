<template>
<el-dropdown id="newActionButton" trigger="click" @command="handleCommand">
    <BrowseActionsButton  :label="$t('tip.new')"  >
        <SvgIcon src="/icons/file/newFolder.svg" :content="$t('tip.new')" round></SvgIcon>
    </BrowseActionsButton>
    <template #dropdown>
        <el-dropdown-menu>
            <el-dropdown-item command="docActionAddFolder" >
                <SvgIcon class="el-icon--left" src="/icons/file/folder-add.svg"></SvgIcon>
                {{$t('filePopover_newFolder')}}</el-dropdown-item>
            <el-dropdown-item command="docActionNewFile" >
                <SvgIcon class="el-icon--left" src="/icons/file/file-new.svg"></SvgIcon>
                {{$t('filePopover_newFile')}}</el-dropdown-item>
            <el-dropdown-item command="docActionUploadFile" divided>
                <SvgIcon class="el-icon--left" src="/icons/file/file-upload.svg"></SvgIcon>
                {{$t('filePopover_uploadFile')}}</el-dropdown-item>
            <el-dropdown-item command="docActionUploadFolder">
                <SvgIcon class="el-icon--left" src="/icons/file/folder-upload.svg"></SvgIcon>
                {{$t('filePopover_uploadFolder')}}</el-dropdown-item>
        </el-dropdown-menu>
    </template>
</el-dropdown>
</template>

<script lang="ts" setup>
const props = defineProps<{
    doc?: any
}>()
const emits = defineEmits([]);
const state = reactive({
})
function handleCommand(command) {
    const data = props.doc
    const ev = new CustomEvent(command,{ detail: data })
    document.dispatchEvent(ev)
}
</script>
<style lang="scss" scoped>
.mg-r {
    margin-right: var(--app-space-xs);
}
.el-dropdown{
    color: var(--app-grey-300);

    .buttonContainer{
        width: 100%;
    }
}
</style>

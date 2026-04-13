<script lang="ts" setup>
import type { Node } from '@antv/x6'

const { node } = defineProps<{
    node:Node
}>()
const allPermission = ref<any[]>([])
const graphProvider = inject(BPMN_PROVIDER)
const editorProvider = inject(EDITOR_PROVIDER);
if(!graphProvider || !editorProvider) {
    throw createError('graph provider not found')   
}
function refreshData(){
    const data = node.getData()
    if(data.data['extensionElements'] && data.data['extensionElements']['flowable:permission']) {
        allPermission.value = data.data['extensionElements']['flowable:permission']
    }else{
        allPermission.value =  []
    }
}


// #region edit permission
const editPermissionDialogShow = ref(false);
const editFormEl = ref()
const editingItemIndex = ref(-1)
function editPermission(editForm:any) {
    editPermissionDialogShow.value = true
    
    nextTick(() => {
        editFormEl.value.setForm(editForm.item)
    })
    editingItemIndex.value = editForm.index
}
function editPermissionHandler(editPermission: any) {
    console.log("editPermissionHandler", editPermission)
    const data = node.getData()
    const permission = data.data['extensionElements']['flowable:permission']
    permission[editingItemIndex.value] = editPermission
    node.setData({
        ...data,
        version: (node.data.version || 0) + 1,
        data: {
            ...data.data,
            'extensionElements': {
                ...data.data['extensionElements'],
                'flowable:permission': permission
            }
        }
    })
    refreshData()
    editPermissionDialogShow.value = false
    editingItemIndex.value = -1
    refreshData()
}
// #endregion


function deletePermission(index: number) {
    const data = node.getData()

    const permission = data.data['extensionElements']['flowable:permission']
    permission.splice(index, 1)
    node.setData({
        ...data,
        version: (node.data.version || 0) + 1,
        data: {
            ...data.data,
            'extensionElements': {
                ...data.data['extensionElements'],
                'flowable:permission': permission
            }
        }
    })
    refreshData()
}

// #region new permission
const newPermissionDialogShow = ref(false)
function newPermission() {
    newPermissionDialogShow.value = true
}
function newPermissionHandler(newPermission: any) {
    const data = node.getData()

    if(data.data['extensionElements'] && data.data['extensionElements']['flowable:permission']) {
        node.setData({
            ...node.data,
            version: (node.data.version || 0) + 1,
            data:{
                ...node.data.data,
                extensionElements:{
                    ...node.data.data.extensionElements,
                    'flowable:permission': [...node.data.data.extensionElements['flowable:permission'],newPermission]
                }
            }
        })
        // emits('updated', props.bpmnJson)
    }else{
        node.setData({
                ...node.data,
                version: (node.data.version || 0) + 1,
                data:{
                    ...node.data.data,
                    extensionElements:{
                        ...node.data.data.extensionElements,
                        'flowable:permission': [newPermission]
                    }
                }
            })
    }

    newPermissionDialogShow.value = false
    refreshData()
}
// #endregion


function handleActions(command:any){
    switch(command.type) {
        case 'edit':
            editPermission(command)
            break
        case 'delete':
            deletePermission(command.index)
            break
    }
}

function setUpListener(){
    graphProvider?.graph.value?.on('history:undo', () => {
      refreshData()
    })
    graphProvider?.graph.value?.on('history:redo', () => {
      refreshData()
    })
}

watch(() => node, async () => {
  console.log("node changed")
  refreshData()
}, {
    immediate: true,
    deep: true
})

onMounted(() => {
    setUpListener()
    refreshData()
})

</script>

<template>
    <div class="permissionContainer">

        <ElTable :data="allPermission">
            <ElTableColumn prop="attr_name" label="User Group" />
            <ElTableColumn prop="attr_accesstype" label="Right" />
            <ElTableColumn label="action">
                <template #default="scope">
                    <ElDropdown @command="handleActions">
                        <ElButton type="primary" :disabled="editorProvider.readonly.value" link>
                            <ElIcon><SvgIcon src="/icons/dots.svg"/></ElIcon>
                        </ElButton>
                        <template #dropdown>
                            <ElDropdownMenu>
                                <ElDropdownItem :disabled="editorProvider.readonly.value" :command="{type:'edit', item: scope.row, index: scope.$index}">Edit</ElDropdownItem>
                                <ElDropdownItem :disabled="editorProvider.readonly.value" :command="{type:'delete', item: scope.row, index: scope.$index }">Delete</ElDropdownItem>
                            </ElDropdownMenu>
                        </template>
                    </ElDropdown>
<!--                            <ElButton type="primary" link @click="emits('updated', scope.row)">Edit</ElButton>-->
                </template>
            </ElTableColumn>
            
        </ElTable>
        <ElButton type="text" :disabled="editorProvider.readonly.value" @click="newPermission">add</ElButton>

        <ElDialog v-model="newPermissionDialogShow" destroy-on-close append-to-body>
            <BpmnContextPermissionNewDialog :allPermission="allPermission" @close="newPermissionDialogShow = false" @submit="newPermissionHandler"/>
            <!-- <WorkflowEditorFormPermissionNewDialog @close="newPermissionDialogShow = false" @submit="newPermissionHandler"/> -->
        </ElDialog>
        <ElDialog v-model="editPermissionDialogShow" append-to-body>
            <BpmnContextPermissionEditDialog ref="editFormEl" :allPermission="allPermission" @close="editPermissionDialogShow = false" @submit="editPermissionHandler"/>

            <!-- <WorkflowEditorFormPermissionEditDialog ref="editFormEl" @close="editPermissionDialogShow = false" @submit="editPermissionHandler"/> -->
        </ElDialog>
    </div>
</template>

<style lang="scss" scoped>
.permissionContainer{
  overflow: auto;
}
</style>

<template>
<el-dialog v-model="state.visible" :title="$t('dashboard.setting')"
    class="scroll-dialog processSetting-dialog big"
    append-to-body 
    :close-on-click-modal="false"
    @close="handleClose"
    >
    <div>
        <h3>{{ $t('caseManage.processSteps') }}</h3>
        <draggable
            class="list-group"
            :list="state.setting.layout"
            group="people"
            itemKey="planItemDefinitionId"
        >
            <template #item="{ element, index }">
            <div class="list-group-item">
                <SvgIcon class="handle-icon" src="/icons/drag.svg" />
                {{element.planItemDefinitionType}}: {{ element.name }}
            </div>
            </template>
        </draggable>
    </div>
    <div>
        <h3>{{ $t('caseManage.avalibleSteps') }}</h3>
        <draggable
            class="list-group"
            :list="state.allList"
            group="people"
            itemKey="planItemDefinitionId"
        >
            <template #item="{ element, index }">
                <div class="list-group-item">
                    <SvgIcon class="handle-icon" src="/icons/drag.svg" />
                    {{element.planItemDefinitionType}}: {{ element.name }}
                </div>
            </template>
        </draggable>
    </div>
    <template #footer>
      <div class="footer-grid">
        <el-button type="primary" :loading="state.loading" @click="handleSubmit">{{$t('common_submit')}}</el-button>
      </div>
    </template>
</el-dialog>
</template>
<script lang="ts" setup>
import draggable from "vuedraggable";
const props = defineProps(['allList'])
const emits = defineEmits([
    'refresh', 'delete'
])
const state = reactive({
    loading: false,
    visible: false,
    setting: {},
    allList: []
})
async function handleSubmit () {
    state.loading = true
    try {
        emits('refresh', { layout: state.setting.layout.map(item => ({
            name: item.name,
            planItemDefinitionId: item.planItemDefinitionId,
            planItemDefinitionType: item.planItemDefinitionType
        })) 
    })
    } catch (error) {
        state.loading = false
    }
    state.visible = false
    state.loading = false
}
function handleOpen(setting) {
    state.visible = true
    setTimeout(async () => {
        if(!setting.layout) setting.layout = []
        state.setting = setting
        state.allList = props.allList.filter(item => !state.setting.layout.find(l => item.planItemDefinitionId === l.planItemDefinitionId))
        state.loading = false
    })
}

defineExpose({ handleOpen })
</script>
<style lang="scss" scoped>
.list-group {
    min-height: 200px;
    overflow: auto;
}
.list-group-item {
    display: flex;
    align-items: center;
    gap: var(--app-space-xs);
    background-color: #fff;
    margin-bottom: var(--app-space-xs);
    padding: var(--app-space-xs);
    .handle-icon {
        --icon-size: 1.14rem;
    }
}
</style>
<style lang="scss" >
.processSetting-dialog {
    .el-dialog__body {
        display: grid;
        grid-template-columns: 1fr 30%;
        gap: var(--app-space-xs);
        & > div {
            background-color: #F2F8F9;
            padding: var(--app-space-xs);
            display: grid;
            grid-template-rows: min-content 1fr;
            overflow: hidden;
        }
    }
}
</style>

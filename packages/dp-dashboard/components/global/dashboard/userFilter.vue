<template>
    <span v-if="!show">{{user || $t('dashboard.allUser')}}</span>
    <el-dropdown v-else trigger="click"  @command="handleCommand">
        <span class="el-dropdown-link">
            <h4>{{user || $t('dashboard.allUser')}}</h4>
            <el-icon class="el-icon--right">
                <arrow-down />
            </el-icon>
        </span>
        <template #dropdown>
            <el-dropdown-menu>
                <el-dropdown-item command='' :disabled="!user">{{$t('dashboard.allUser')}}</el-dropdown-item>
                <el-dropdown-item v-for="item in state.userList" :key="item.value" :command="item.value" :disabled="item.value === user">{{item.label}}</el-dropdown-item>
            </el-dropdown-menu>
        </template>
    </el-dropdown>
</template>

<script lang="ts" setup>
import { ArrowDown } from '@element-plus/icons-vue'
import { fetchUsersSelectSorted } from '@packages/base/composables/usePermissionOption'
const props = withDefaults( defineProps<{
    user: string,
    show: boolean
}>() , {
    user: '',
    show: true
})
const state = reactive({
    userList: [] as { label: string; value: string }[]
})
const emits = defineEmits([
    'refreshSetting', 'delete', 'update:layout'
])
function handleCommand(command) {
    emits('refreshSetting', command)
}
onMounted(async() => {
  state.userList = await fetchUsersSelectSorted()
})
</script>

<style lang="scss" scoped>
.el-dropdown-link {
    display: flex;
}
</style>

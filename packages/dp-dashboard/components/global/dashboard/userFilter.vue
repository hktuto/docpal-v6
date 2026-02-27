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
                <el-dropdown-item v-for="item in state.userList" :command="item.userId" :disabled="item.userId === user">{{item.username}}</el-dropdown-item>
            </el-dropdown-menu>
        </template>
    </el-dropdown>
</template>

<script lang="ts" setup>
import { ArrowDown } from '@element-plus/icons-vue'
import { newClientApi } from 'api';
const props = withDefaults( defineProps<{
    user: string,
    show: boolean
}>() , {
    user: '',
    show: true
})
const state = reactive({
    userList: []
})
const emits = defineEmits([
    'refreshSetting', 'delete', 'update:layout'
])
function handleCommand(command) {
    emits('refreshSetting', command)
}
onMounted(async() => {
  state.userList = await newClientApi.postUcenterUsers({}).then((res) => res.data)
})
</script>

<style lang="scss" scoped>
.el-dropdown-link {
    display: flex;
}
</style>

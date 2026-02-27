<template>
    <el-badge :value="unreadCount" :hidden="unreadCount === 0" is-dot  class="actionIcons">
        <SvgIcon src="/icons/notification.svg" @click="dialogOpened = true"></SvgIcon>
    </el-badge>
    <el-dialog v-model="dialogOpened" append-to-body>
        <NotificationTable />
        <!-- <NotificationNTable /> -->
        <template  #footer>
            <slot name="footer"></slot>
        </template>
    </el-dialog>
</template>

<script lang="ts" setup>
import { newClientApi } from 'api';
const unreadCount = ref(0);
const dialogOpened = ref(false);
async function getUnreadCount() {
    const { result } = await newClientApi.getNotificationUnreadNumber().then(r =>r.data)
    unreadCount.value = result;
}
onMounted(() => {
    getUnreadCount();
})
</script>

<style lang="scss" scoped>
</style>
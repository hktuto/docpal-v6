<template>
     <div class="infinite-container">
        <div v-for="item in list" :key="item.id" class="listItemContainer">
            <el-badge is-dot :hidden="item.status === 'READED'">
                <el-checkbox :label="item.id">{{item.createDate}} - {{$t(`notification.${item.functionPoint}`)}}</el-checkbox>
                <SvgIcon src="/icons/trash_pure.svg"  @click.native.stop="handleDelete(item, index)"></SvgIcon>
            </el-badge>
            <div v-if="item.content.templateId">
                {{$t(item.content.templateId)}}
            </div>

            <!-- table  -->
            <table>
                  <tr v-if="item.content.processDefinitionName">
                    <td>{{$t('workflow_taskName')}}</td>
                    <td>{{item.content.processDefinitionName}} - {{item.content.businessKey}} </td>
                  </tr>
                  <tr v-if="item.content.documentName">
                    <td>{{$t('dpDocument_fileName')}}</td>
                    <td>{{item.content.documentName}}</td>
                  </tr>
                  <tr v-if="item.content.documentPath">
                    <td>{{$t('tableHeader_path')}}</td>
                    <td>{{item.content.documentPath}}</td>
                  </tr>
                  <tr v-if="item.createdBy" >
                    <td>{{$t('table_creator')}}</td>
                    <td>{{item.createdBy }}</td>
                  </tr>
                  <tr v-else-if="item.content.creator || item.content.user_creator_id" >
                    <td>{{$t('table_creator')}}</td>
                    <td>{{item.content.creator || item.content.user_creator_id }}</td>
                  </tr>
                  <tr v-if="item.content.emailList" >
                    <td>{{$t('dpTable_email')}}</td>
                    <td>{{JSON.parse(item.content.emailList).join(',') }}</td>
                  </tr>
                  <tr v-if="item.content.user_approver_id" >
                    <td>{{$t('role.approver')}}</td>
                    <td>{{item.content.user_approver_id}}</td>
                  </tr>
                  <tr v-if="item.content.startTime">
                    <td>{{$t('workflow_startTime')}}</td>
                    <td>{{formatDate(item.content.startTime)}}</td>
                  </tr>
                  <tr v-if="item.content.approvedDate">
                    <td>{{$t('dpTable_approvedDate')}}</td>
                    <td>{{formatDate(item.content.approvedDate)}}</td>
                  </tr>
                </table>
                <!-- end table -->
                <el-button v-if="isRoute(item)">
                </el-button>
        </div>
     </div>
</template>

<script lang="ts" setup>
import { newClientApi } from 'api';
type Notification = {
    id: number;
    title: string;
    content: any;
    type: string;
    createDate: string;
    functionPoint: any;
    processInstanceId?: string;
    status: string;
}
const list = ref<Notification[]>([]);
const total = ref(0);

const loading = ref(false);
const userId = useUserId()
function handleDelete(item: Notification, index: number) {
    dpLog(item, index);

    // TODO: delete notification
}

function isRoute(item: Notification) {
    // function point that should not be routed
    const notRoute = ['Document_TRASH', 'Document_DELETE', 'Workflow_CANCELD'];
    return !notRoute.includes(item.functionPoint) && (item.content.documentId || item.content.processInstanceId);

}

async function getNotificationList() {
    loading.value = true;
    const param = {
      pageNum: 0,
      pageSize: 20,
    }
    try {
      const {data:res} = newClientApi.postNotificationPage(param, {receiveId:userId.value});
       res.content.forEach(item => {
          item.content = JSON.parse(item.content) || {}
          item.createDate = formatDate(item.createdDate) || null
        });
      
      list.value = res.content;
      total.value = res.totalElements;
    } catch (error) {
      
    }
    loading.value = false;
}

// get list on Mounted
onMounted(() => {
    getNotificationList()
});

</script>

<style lang="scss" scoped>
.infinite-container {
  height: 70vh;
  overflow: auto;
  .infinite-list-item {
    margin: var(--app-space-xs);
      :deep(.el-badge__content) {
        left: 0;
        top: 5px;
      }
    :deep(.el-card__header) {
      padding: unset;
      .el-badge {
        padding: var(--app-space-xs);
        line-height: 2rem;
        display: grid;
        grid-template-columns: 1fr min-content;
        align-items: center;
        .el-badge__content {
          left: -1rem;
          top: 0.5rem;
          width: 1rem;
          height: 1rem;
        }
      }
    }
  }
  p {
    text-align: center;
    padding: var(--app-space-xs);
  }
  table {
    tr {
      line-height: 1.3rem;
      font-size: 0.8rem;
      td:first-child {
        text-align: right;
        text-align-last: justify;
        padding-right: var(--app-space-xs);
      }
    }
  }
}
</style>

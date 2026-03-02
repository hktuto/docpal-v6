<template>
  <el-dialog
    v-model="state.visible"
    class="scroll-dialog"
    :title="
      unreadCount > 0
        ? `${$t('notifications.text')}(${unreadCount})`
        : $t('notifications.text')
    "
    :close-on-click-modal="false"
    append-to-body
  >
    <div class="infinite-container">
      <div
        v-infinite-scroll="getNotiPage"
        class="infinite-list"
        :infinite-scroll-disabled="state.scrollNoMore || state.loading"
        :infinite-scroll-immediate="false"
      >
        <el-checkbox-group
          v-model="state.checkedNotis"
          class="checkboxGroup"
          @change="handleCheckedNotisChange"
        >
          <div
            v-for="(item, index) in state.notiList"
            :key="item.id"
            class="infinite-list-item cursorPointer"
            @click.native="handleRead(item)"
          >
            <el-badge is-dot class="ellipsis" :hidden="item.status === 'READED'">
              <el-checkbox :label="item.id"> </el-checkbox>
            </el-badge>
            <div class="notificationContent">
              <div class="small">{{ displayTime(item.createdDate) }}</div>
              <div class="itemType">
                {{ $t(`notification.${item.functionPoint}`) }}
              </div>
              <div class="body">
                <!--                        <div v-if="item.content.templateId">-->
                <!--                          {{$t(item.content.templateId)}}-->
                <!--                        </div>-->

                <div class="notificationContentList">
                  <div v-if="item.content.processDefinitionName">
                    <div class="small">{{ $t("workflow_taskName") }}</div>
                    <div>
                      {{ item.content.processDefinitionName }} -
                      {{ item.content.businessKey }}
                    </div>
                  </div>
                  <div v-if="item.content.documentName">
                    <div class="small">{{ $t("dpDocument_fileName") }}</div>
                    <div>{{ item.content.documentName }}</div>
                  </div>
                  <div v-if="item.content.documentPath">
                    <div class="small">{{ $t("tableHeader_path") }}</div>
                    <div>{{ item.content.documentPath }}</div>
                  </div>
                  <div v-if="item.createdBy">
                    <div class="small">{{ $t("table_creator") }}</div>
                    <div>{{ item.createdBy }}</div>
                  </div>
                  <div v-else-if="item.content.creator || item.content.user_creator_id">
                    <div class="small">{{ $t("table_creator") }}</div>
                    <div>{{ item.content.creator || item.content.user_creator_id }}</div>
                  </div>
                  <div v-if="item.content.emailList">
                    <div class="small">{{ $t("dpTable_email") }}</div>
                    <div>{{ JSON.parse(item.content.emailList).join(",") }}</div>
                  </div>
                  <div v-if="item.content.user_approver_id">
                    <div class="small">{{ $t("role.approver") }}</div>
                    <div>{{ item.content.user_approver_id }}</div>
                  </div>
                  <div v-if="item.content.startTime">
                    <div class="small">{{ $t("workflow_startTime") }}</div>
                    <div>{{ formatDate(item.content.startTime) }}</div>
                  </div>
                  <div v-if="item.content.approvedDate">
                    <div class="small">{{ $t("dpTable_approvedDate") }}</div>
                    <div>{{ formatDate(item.content.approvedDate) }}</div>
                  </div>
                </div>
                <el-button
                  v-if="isRoute(item)"
                  type="primary"
                  size="small"
                  @click="goRoute(item)"
                  >{{ $t("jump_to_view") }}</el-button
                >
              </div>
            </div>

            <SvgIcon
              src="/icons/trash_pure.svg"
              @click.native.stop="handleDelete(item, index)"
            ></SvgIcon>
          </div>
          <!--                <el-card v-for="(item, index) in state.notiList" :key="item.id" class="infinite-list-item cursorPointer" -->
          <!--                    @click.native="handleRead(item)">-->
          <!--                    -->
          <!--                    <el-badge slot="header" is-dot class="ellipsis" :hidden="item.status === 'READED'">-->
          <!--                        <el-checkbox :label="item.id" :key="item.id">{{item.createDate}} - {{$t(`notification.${item.functionPoint}`)}}</el-checkbox>-->
          <!--                        <SvgIcon src="/icons/trash_pure.svg"  @click.native.stop="handleDelete(item, index)"></SvgIcon>-->
          <!--                    </el-badge>-->
          <!--                    <div v-if="item.content.templateId">-->
          <!--                        {{$t(item.content.templateId)}}-->
          <!--                    </div>-->
          <!--                    <table>-->
          <!--                        <div v-if="item.content.processDefinitionName">-->
          <!--                            <div>{{$t('workflow_taskName')}}</div>-->
          <!--                            <div>{{item.content.processDefinitionName}} - {{item.content.businessKey}}</div>-->
          <!--                        </div>-->
          <!--                        <div v-if="item.content.documentName">-->
          <!--                            <div>{{$t('dpDocument_fileName')}}</div>-->
          <!--                            <div>{{item.content.documentName}}</div>-->
          <!--                        </div>-->
          <!--                        <div v-if="item.content.documentPath">-->
          <!--                            <div>{{$t('tableHeader_path')}}</div>-->
          <!--                            <div>{{item.content.documentPath}}</div>-->
          <!--                        </div>-->
          <!--                        <div v-if="item.createdBy" >-->
          <!--                            <div>{{$t('operator')}}</div>-->
          <!--                            <div>{{item.createdBy }}</div>-->
          <!--                        </div>-->
          <!--                        <div v-else-if="item.content.creator || item.content.user_creator_id" >-->
          <!--                            <div>{{$t('user_creator_id')}}</div>-->
          <!--                            <div>{{item.content.creator || item.content.user_creator_id }}</div>-->
          <!--                        </div>-->
          <!--                        <div v-if="item.content.emailList" >-->
          <!--                            <div>{{$t('emailList')}}</div>-->
          <!--                            <div>{{JSON.parse(item.content.emailList).join(',') }}</div>-->
          <!--                        </div>-->
          <!--                        <div v-if="item.content.user_approver_id" >-->
          <!--                            <div>{{$t('user_approver_id')}}</div>-->
          <!--                            <div>{{item.content.user_approver_id}}</div>-->
          <!--                        </div>-->
          <!--                        <div v-if="item.content.startTime">-->
          <!--                            <div>{{$t('workflow_startTime')}}</div>-->
          <!--                            <div>{{formatDate(item.content.startTime)}}</div>-->
          <!--                        </div>-->
          <!--                        <div v-if="item.content.approvedDate">-->
          <!--                            <div>{{$t('dpTable_approvedDate')}}</div>-->
          <!--                            <div>{{formatDate(item.content.approvedDate)}}</div>-->
          <!--                        </div>-->
          <!--                    </table>-->
          <!--                    <el-button v-if="isRoute(item)" type="primary" @click="goRoute(item)" >{{$t('jump_to_view')}}</el-button>-->
          <!--                </el-card>-->
        </el-checkbox-group>
      </div>
      <p v-show="state.loading" class="loading" style="text-align: center">
        <i class="el-icon-loading"></i>
      </p>
      <p
        v-if="state.scrollNoMore && !state.loading"
        style="font-size: 13px; color: #ccc; text-align: center"
      >
        {{ $t("noMore") }}
      </p>
    </div>
    <template #footer>
      <div class="flex-x-between">
        <el-checkbox
          :indeterminate="state.isIndeterminate"
          v-model="state.checkAll"
          @change="handleCheckAllChange"
          >{{ $t("button.selectAll") }}</el-checkbox
        >
        <div>
          <el-button type="primary" size="mini" @click="handleReadAll">{{
            $t("button.readAll")
          }}</el-button>
          <el-button
            v-show="state.checkedNotis.length > 0"
            type="danger"
            size="mini"
            @click="handleDeleteSelected"
            >{{ $t("button.deleteSelected") }}({{ state.checkedNotis.length }})</el-button
          >
        </div>
      </div>
    </template>
  </el-dialog>
</template>
<script lang="ts" setup>
import { newClientApi } from "api";
const props = defineProps<{
  unreadCount: number;
}>();
type Notification = {
  id: number;
  title: string;
  content: any;
  type: string;
  createDate: string;
  functionPoint: any;
  processInstanceId?: string;
  status: string;
};
const emit = defineEmits(["close", "unreadCountChange"]);
const state = reactive({
  loading: false,
  visible: false,
  notiList: [],
  notiTotal: 0,
  checkedNotis: [],
  checkAll: false,
  isIndeterminate: false,
  notiPageParam: {
    pageNum: 0,
    pageSize: 20,
  },
  scrollNoMore: false,
});
const router = useRouter();
const userId = useUserId();
// const scrollNoMore = computed(() => {
//     return state.notiList.length >= state.notiTotal
// })
// const scrollDisabled = computed(() => {
//     return scrollNoMore.value || state.loading
// })

const { displayTime } = useTime();
async function getNotiPage() {
  state.loading = true;
  const { data: res } = await newClientApi.postNotificationPage(state.notiPageParam, {
    receiveId: userId.value,
  });

  if (res && res.content) {
    const content = res.content.map((item) => {
      if (typeof item.content === "string") {
        item.content = JSON.parse(item.content);
      }
      return item;
    });
    state.notiList.push(...content);
    state.notiTotal = res.totalElements;
    state.scrollNoMore = state.notiList.length >= state.notiTotal;
    state.notiPageParam.pageNum++;
    state.loading = false;
    state.isIndeterminate =
      state.checkedNotis.length > 0 && state.checkedNotis.length < state.notiList.length;
  }
}
function handleCheckedNotisChange(value) {
  const checkedCount = value.length;
  state.checkAll = checkedCount === state.notiList.length;
  state.isIndeterminate = checkedCount > 0 && checkedCount < state.notiList.length;
}
// #region module: delete
async function handleDeleteSelected() {
  await newClientApi.deleteNotification(state.checkedNotis);
  state.checkAll = false;
  state.checkedNotis = [];
  state.notiList = [];
  state.notiPageParam.pageNum = 0;
  await getNotiPage();
}
async function handleDelete(item, index) {
  if (item.loading) return;
  item.loading = true;
  try {
    const { data: res } = await newClientApi.deleteNotification([item.id]);
    if (res) {
      state.notiList.splice(index, 1);
      const notiIndex = state.checkedNotis.findIndex((notiId) => notiId === item.id);
      if (notiIndex) state.checkedNotis.splice(notiIndex, 1);
      if (state.notiList.length < state.notiPageParam.pageSize) {
        state.notiList = [];
        state.notiPageParam.pageNum = 0;
        await getNotiPage();
      }
    }
  } catch (error) {}
  item.loading = false;
}
// #endregion

// #region module: read
async function handleRead(item) {
  const { data: res } = await newClientApi.putNotificationIdUpdateStatusStatus(item.id, 'READED');
  if (res && item.status !== "READED") {
    item.status = "READED";
    emit("unreadCountChange", props.unreadCount - 1);
  }
}
async function handleReadAll() {
  const { data: res } = await newClientApi.postNotificationReadAll();
  if (res) {
    state.notiList.forEach((item) => {
      item.status = "READED";
    });
    emit("unreadCountChange", 0);
    // state.unReadNumber = 0
  }
}
function handleCheckAllChange(val) {
  state.checkedNotis = val
    ? state.notiList.reduce((pre, item) => {
        pre.push(item.id);
        return pre;
      }, [])
    : [];
  state.isIndeterminate = false;
}
// #endregion
// #region module: route
function isRoute(item) {
  return (
    item.functionPoint !== "Document_TRASH" &&
    item.functionPoint !== "Document_DELETE" &&
    item.functionPoint !== "Workflow_CANCELD" &&
    (item.content.documentId || item.content.processInstanceId)
  );
}
async function goRoute(item) {
  emit("close");
  if (item.content.documentId) {
    router.push({
      path: "/browse",
      query: {
        path: item.content.documentId,
      },
    });
  } else if (item.content.processInstanceId) {
    const { id } = await getTaskByProcessInstanceId(item.content.processInstanceId);
    if (id) {
      router.push({
        path: `/workflow/${id}`,
      });
    } else {
      router.push({ path: `/workflow/${item.content.processInstanceId}?state=complete` });
    }
  }
  state.visible = false;
}
// #endregion
function handleOpen(searchParams) {
  state.visible = true;
}
function initData() {
  state.notiList = [];
  state.notiPageParam.pageNum = 0;
  getNotiPage();
}
onMounted(() => {
  initData();
});
defineExpose({ handleOpen, initData });
</script>
<style lang="scss" scoped>
.scroll-dialog {
}
.infinite-container {
  min-height: 50vh;
  .infinite-list-item {
    display: flex;
    flex-flow: row nowrap;
    align-items: flex-start;
    justify-content: flex-start;
    gap: var(--app-space-xs);
    :deep(.el-badge__content) {
      left: -8px;
      top: 5px;
      right: unset;
    }
  }
  .infinite-list-item + .infinite-list-item {
    border-top: 1px solid var(--app-grey-950);
  }
  .el-checkbox {
    display: flex;
    flex-flow: row nowrap;
    justify-content: flex-start;
    align-items: flex-start;
    height: auto;
    padding-block: var(--app-space-xs);
    :deep(.el-checkbox__label) {
      display: none;
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
.el-checkbox-group {
  margin-inline: calc(var(--app-space-xs) * -1);
}
.body {
}
.small {
  font-size: 0.7rem;
}
.itemType {
  font-size: 1rem;
}
.notificationContent {
  line-height: 1.2;
  padding-block: var(--app-space-xs);
}
.notificationContentList {
  > * {
    line-height: 1;
    display: block;
    padding-block: 4px;
    > :first-child {
      font-size: 0.6rem;
    }
    > :last-child {
      font-size: 0.9rem;
    }
  }
}
.checkboxGroup {
  padding-inline: 12px;
}
</style>

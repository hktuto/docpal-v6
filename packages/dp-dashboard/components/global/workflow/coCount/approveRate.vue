<template>
    <div ref="cardRef" class="co-count co-count-chart">
        <div id="myEcharts" ref="chartRef" class="echart"></div>
    </div>
</template>

<script lang="ts" setup>
import * as echarts from "echarts";
import { newClientApi } from 'api';
import { useEventListener } from '@vueuse/core'
const props = withDefaults( defineProps<{
    dates?: any;
    documentType?: string,
    user?: string
}>() , {
    documentType: '',
    user: ''
})
const { t } = useI18n()

type EChartsOption = echarts.EChartsOption;
const chartRef = ref()
const cardRef = ref()
let echartInstance
const emits = defineEmits([
    'refreshSetting', 'delete'
])
const setting = {
    defaultSetting: {
        options: {
            xAxis: {
                type: 'category',
                boundaryGap: false,
                data: []
            },
            title: {
                text: t('dashboard.newCount'),
                left: "left",
            },
            yAxis: {
                type: 'value'
            },
            tooltip: {
                appendToBody: true,
                trigger: 'item'
            },
            legend: {
                bottom: '5%',
                left: 'center',
                itemWidth: 10,
                itemHeight: 10,
            }
        },
        series: {
            type: 'bar',
            smooth: true
        }
    }
}
const state = reactive({
    data: [],
    xAxis: []
})
let options: any = {}

// #region module: set
    function initStyle () {
        const pHeight = cardRef.value.offsetHeight
        const pWidth = cardRef.value.offsetWidth
        console.log(pHeight,pWidth)
        // 需要扣除 .el-card 的 padding
        chartRef.value.style = `height: ${pHeight}px; width: ${pWidth - 20}px`
    }
// #endregion
async function initChart() {
    initStyle()
    if (echartInstance) echartInstance.clear()
    echartInstance = echarts.init(chartRef.value);
    echartInstance.setOption(options);
}
function resize() {
    setTimeout(async() => {
        initStyle()
        if(!!echartInstance) echartInstance.resize()
    },10)
}
// #region module: setting
    const settingRef = ref()
    function openSetting() {
        settingRef.value.handleOpen(props.setting)
    }
    async function getIconStyle(iconSrc) {
        const style = {
            image: await parseSvg(iconSrc),
            width: chartRef.value.clientWidth / 10,
        }
        return style
    }
    const GetCoCountSizeApi = async(params: any, creator?: string) => {
        if (creator) {
            return await newClientApi.postDsbNewFilesUserSizeDtypeMonthlyCumulation({
                ...params,
                creator
            }).then(res => res.data)
        }
        return await newClientApi.postDsbNewFilesUsersSizeDtypeMonthlyCumulation(params).then(res => res.data)
    }
    async function handleInitChart(documentType) {
        options = { 
            ...setting.defaultSetting.options
        }
        // data
        await getData(documentType)
        options.xAxis.data = state.xAxis
        options.series = {
            ...setting.defaultSetting.series,
            data: state.data
        }
        initChart()
    }
    async function getData(documentType: string) {
        try {
            const params = {
                primaryType: documentType,
            }
            if (props.dates) {
                params.isQueryList = true
                params.dateRange = {
                    from: props.dates[0],
                    to: props.dates[1]
                }
            }
            const res = await GetCoCountSizeApi(params, props.user)
            state.xAxis = []
            const initData = res.group_document_type.buckets[0].group_by_time.buckets
            state.data = initData.reduce((prev,item) => {
                prev.push(item.cumulative_sum_mb.value)
                state.xAxis.push(item.key_as_string)
                return prev
            }, [])
            console.log(state.data)
        } catch (error) {
        }
    }
// #endregion
// #region module: 
// #endregion
onMounted(async() => {
    nextTick(async() => {
        initStyle()
        // 随着屏幕大小调节图表
        useEventListener(window, 'resize', resize)
        handleInitChart('File')
    })
})
onUnmounted(() => {
    if(!!echartInstance) echartInstance.dispose()
})
watch(() => props, (newValue) => {
    
}, {
    immediate: true,
    deep: true
})
defineExpose({
    resize
})
</script>

<style lang="scss" scoped>
</style>

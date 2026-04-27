<template>
    <div class="contentContainer" v-loading="loading">
        <iframe ref="iframe" :src="pdfReaderUrl" allowfullscreen />
    </div>
</template>

<script lang="ts" setup>
import { newClientApi } from 'api'
import { useEventListener } from '@vueuse/core'
type PdfJsOptions = {
    print: boolean,
    loadAnnotations: boolean,
    readOnly: boolean
}
const props = withDefaults(defineProps<{
    doc?: any,
    options: PdfJsOptions
}>(),{
    doc: null,
    options:{
        print: false,
        loadAnnotations: false,
        readOnly: false
    }
})

const iframe = ref<HTMLIFrameElement>();
const {public:{pdfReaderUrl}} = useRuntimeConfig();
const emits = defineEmits(['noPdf'])
const loading = ref(false);
// const colorMode = useColorMode();
const {locale} = useI18n()
const { options } = toRefs(props)
const blob = ref();
async function getAnnotation():Promise<Object> {
    if(!props.options.loadAnnotations) return new Map();
    const annotation = await newClientApi.getDmsDocumentAnnotation({idOrPath: props.doc.id}).then(r =>r.data)
    let annotationObj = []
    if(annotation.length > 0) {
        if(annotation[0].object.paths) {
            annotationObj = Array.isArray(JSON.parse(annotation[0].object.paths)) ? JSON.parse(annotation[0].object.paths) : []
        }
    }
    const annotationMap = new Map();
    annotationObj.forEach((item:any) => {
        annotationMap.set(item.id, item);
    });
    return annotationMap;
}

async function downloadPdf() {
  await downloadBlob(blob.value, props.doc.name + '.pdf')
}
async function sendPdfAndAnnotation() {
    if(props.doc.isFolder) return; // 如果是文件夹，不要拿预览
    loading.value = true;
    try {
        const b = await newClientApi.postDmsDocumentPreview({idOrPath: props.doc.id},{
            format:'blob',
            timeout: 0,
            headers: {
                key: 'preview'
            }
        })
        blob.value = b;
        if(blob.value.type !== 'application/pdf') {
            emits('noPdf', blob.value.type)
            loading.value = false;
            return
        }
        const annotations = await getAnnotation();
        const frame = iframe.value?.contentWindow;
        frame?.postMessage({blob:blob.value, filename: props.doc.name, annotations, locale: locale.value, options: props.options }, '*');
    } catch (error) {
        console.log(error);
    }
    loading.value = false;
}
function refresh() {
    sendPdfAndAnnotation()
}
function gotMessageFromIframe(message:MessageEvent) {
    const { data:{ data, type} } = message;
    if(!data && !type ) return;
    switch(type) {
      case 'ready':
        console.log("PDF viewer is ready")
        sendPdfAndAnnotation()
        break;
      case 'annotation':
        saveAnnotation(data)
        break;
      case 'print':
        console.log('print from pdf')
        // TODO: handle print event
        break;
      default:
        break;
    }

}

async function downloadPdfAndAnnotation() {
    const frame = iframe.value?.contentWindow;
    // get frame html content and trigger print button
    // REMARK : only work when frame is on same domain
    const html = frame?.document;
    if(!html) return;
    const btn = html.getElementById('download');
    btn?.click();
}

async function saveAnnotation(annotation:Map<string, object>) {
    //return if annotation is empty

    // convert Map to array of objects
    const paths:any[] = [];
    const comments = [];

    annotation.forEach((value:any, key:any) => {
        if(value.annotationType === 3){
            comments.push({text:value.value});
          }
      paths.push({id: key, ...value});
    });
    const param = {
        documentIdOrPath: props.doc.id,
        object: {
            paths: JSON.stringify(paths)
        },
        comments
    }
    await newClientApi.postDmsDocumentAnnotation([param])
}
// TODO : message must contain doc id, and match with props.doc.id
useEventListener(window, 'message', gotMessageFromIframe)
useEventListener(window, 'downloadPdfAndAnnotation', downloadPdfAndAnnotation)
useEventListener(document, 'downloadPdf', downloadPdf)
defineExpose({ refresh })
</script>

<style lang="scss" scoped>
.contentContainer{
    width: 100%;
    height: 100%;
    margin: 0 auto;
    background: #fff;
    border-radius: 12px;
    overflow: hidden;
}
iframe {
        width: 100%;
        height: 100%;
        border: none;
    }
</style>

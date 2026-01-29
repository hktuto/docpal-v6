import {fabric} from "fabric";
import { clientApi } from 'api'
export type Watermark = {
  id: number
  order?: number,
  name?: string,
  type: 'image' | 'text' | 'dynamic'
  contentType?: string,
  data?: string,
  content?: string,
  position: 'tLeft' | 'tRight' | 'bLeft' | 'bRight' |  'center',
  opacity?: number,
  rotate: number,
  offset: {
    x: number,
    y: number
  },
  centerOffset: {
    x: number,
    y: number
  },
  font?: {
    name:'',
    size: number,
    color: string,
  },
  size?: number,
  scale: string,
}

export type WatermarkTemplate = {
  id:string,
  name: string
}

export type WatermarkTemplateDetail = WatermarkTemplate & {watermarkSettings: Watermark[]}

const defaultTextWatermark = {
  type: 'text',
  contentType: 'text',
  left: 0,
  top: 0,
  fontFamily: 'arial',
  fill: '#000000',
  fontSize: 20,
  fontWeight: 'normal',
  textAlign: 'left',
  originX: 'left',
  originY: 'top',
  angle: 0,
  opacity: 1,
  scaleX: 1,
  scaleY: 1,
  charSpacing: 0,
  stroke: null,
  strokeWidth: 0,
  paintFirst: 'fill',
  globalCompositeOperation: 'source-over',
  skewX: 0,
  skewY: 0,
  textBackgroundColor: '',
  lockScaling: true,
  position: 'tLeft',
  offset:{
    x:0,
    y:0,
  },
  font:{
    size: 3,
    color: '#000000',
    name: ''
  },
  snapAngle: 1,
}
export type Response<T> = {
  code: number
  message: string,
  data : T
}
export const useWatermark = () => {

  const list = ref<WatermarkTemplate[]>([])
  const watermarkTypes = ['image', 'text', 'dynamic'];
  
  // TODO 'clearanceLevel' 对不上，先隐藏
  const textTypes = ["text", "title", 'version', "lastModify", 'createAt', 'createBy', 'contributors', 'watermarkApplyBy', 'watermarkApplyAt']

  function isTextWatermark(type: string) {
    return type === 'text' || type === 'dynamic';
  }

  async function createWatermarkTemplate(template: {name:string}) {
    return  await clientApi.api.postDocpalWatermarkTemplates(template).then(r =>r.data)
  }

  async function removeWatermarkTemplate(id:string) {
    return await clientApi.api.deleteDocpalWatermarkTemplatesId(id).then(r =>r.data)
  }

  // async function removeWatermarkApi(id:string) {
  //   const {data } = await clientApi.api.deleteWatermarkSettingsId(id) as any
  //   const { data } = await api.delete<Response<boolean>>(`/docpal/watermark/settings/${id}`).then(res => res.data)
  //   return data;
  // }
  async function getWatermarkTemplateDetail(id:string):Promise<WatermarkTemplateDetail> {
    return await clientApi.api.getDocpalWatermarkTemplatesId(id).then(r =>r.data)
    // const { data } = await api.get<Response<WatermarkTemplateDetail>>(`/docpal/watermark/templates/${id}`).then(res => res.data);
  }
  async function updateWatermarkTemplateDetail(template:WatermarkTemplateDetail) {
    return await clientApi.api.patchDocpalWatermarkTemplates(template as any).then(r =>r.data)
    // const { data } = await api.patch<Response<WatermarkTemplateDetail>>(`/docpal/watermark/templates`, template).then(res => res.data);
  }

  function fontSizeConverter(size, height) {
    return size * height / 800
  }


  function watermarkToFabricObject(item:Watermark, canvas:fabric.Canvas) {
    switch(item.type){
      case 'text' :
        // @ts-ignore
        const text = new fabric.IText(item.content, {
          ...defaultTextWatermark,
          // @ts-ignore
          id: item.id,
          type: 'text',
          contentType: 'text',
          left: item.offset.x * canvas.getWidth(),
          top: item.offset.y * canvas.getHeight(),
          fill: item.font.color,
          fontSize: fontSizeConverter(item.font.size, canvas.getHeight()),
          angle: item.rotate || 0,
          opacity: item.opacity || 1,
          position: item.position,
          offset: item.offset,
          font:item.font,
          centerOffset: item.centerOffset,
        });
        setupControl(text);
        return text;
      case 'dynamic' :
        const dynamicText = new fabric.IText(item.content, {
          ...defaultTextWatermark,
          // @ts-ignore
          id: item.id,
          type: item.type,
          left: item.offset.x * canvas.getWidth(),
          top: item.offset.y * canvas.getHeight(),
          contentType: item.contentType,
          fill: item.font.color,
          fontSize: fontSizeConverter(item.font.size, canvas.getHeight()),
          angle: item.rotate || 0,
          opacity: item.opacity || 1,
          position: item.position,
          offset: item.offset,
          font:item.font
        });

        setupControl(dynamicText);
        return dynamicText;
      case 'image' :
        break;
    }
  }


  function setupControl(obj:fabric.Object) {
    obj.setControlsVisibility({
      tr: false,
      tl: false,
      mt: false,
      mr: false,
      ml: false,
      bl: false,
      br: false,
      mb: false,
    })
  }

  function newTextWatermark(canvas:fabric.Canvas) {
      const text =  new fabric.IText('New Text', {
        ...defaultTextWatermark,
        // @ts-ignore
        id: 'object_' + Date.now(),
        fontSize: fontSizeConverter(20, canvas.getHeight()),
        offset:{
          x:0,
          y:0,
        },
        font:{
          size: 20,
          color: '#000000',
          name: ''
        }
      });
      setupControl(text);

      return text;
    }
  function newImageWatermark(canvas:fabric.Canvas):HTMLImageElement {
    // create id and add to object
    const id = 'object_' + Date.now();
    // add hidden image to dom
    const img = document.createElement('img');
    img.id = id;
    img.src = '/images/logo-withName-dark.svg';
    img.style.display = 'none';
    return img
  }
  return {
    createWatermarkTemplate,
    removeWatermarkTemplate,
    getWatermarkTemplateDetail,
    updateWatermarkTemplateDetail,
    list,
    isTextWatermark,
    textTypes,
    watermarkTypes,
    fontSizeConverter,
    newTextWatermark,
    newImageWatermark,
    watermarkToFabricObject,
  }
}

import type { InjectionKey } from '#imports';
import type { PermissionMethodParams, TableMenuValidateMethodParams } from '../../../packages/base/composables/useVxeTable';


interface WorkflowEditorListProvider {
    getListApi:(pageParams:any) => Promise<any>
    openProductionVersion:(data:any, openInNewTab?:boolean) => void
    openLastestVersion:(data:any, openInNewTab?:boolean) => void
    openVersions:(data:any, openInNewTab?:boolean) => void
    saveAsNewWorkflow:(data:any) => void
    deleteWorkflow:(data:any) => void
    activeWorkflow:(data:any) => void
    actionPermission:(params:PermissionMethodParams) => {disabled:boolean, visible:boolean}
    createNewWorkflow:() => void
}

export const WorkflowEditorListProviderKey: InjectionKey<WorkflowEditorListProvider> = Symbol('workflowEditorListProvider');
export type ActionPermissionParams = {row:any, index?:number, code:string}
interface WorkflowEditorVersionListProvider {
    getListApi:(pageParams:any) => Promise<any>
    editHandler:(row:any, openInNewTab?:boolean) => void
    actionPermission:(arg: PermissionMethodParams) => {disabled:boolean, visible:boolean}
    saveAsNewVersionHandler:(row:any) => void
    promoteToProductionHandler:(row:any) => void
}

export const WorkflowEditorVersionListProviderKey: InjectionKey<WorkflowEditorVersionListProvider> = Symbol('workflowEditorVersionListProvider');
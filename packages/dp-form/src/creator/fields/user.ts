export const UserSelectField = () => ({
    "key": Date.now(),
    "type": "select",
    "icon": "select-field",
    "formItemFlag": true,
    "options": {
        "name": "name",
        "label": "label",
        "labelAlign": "",
        "defaultValue": [],
        "placeholder": "",
        "columnWidth": "200px",
        "size": "",
        "labelWidth": null,
        "labelHidden": false,
        "clearable": true,
        "filterable": true,
        "allowCreate": false,
        "remote": false,
        "automaticDropdown": false,
        "multiple": true,
        "multipleLimit": 0,
        "optionItems": [],
        "readonly": false,
        "disabled": false,
        "hidden": false,
        "required": false,
        "requiredHint": "",
        "validation": "",
        "validationHint": "",
        "customClass": [],
        "labelIconClass": null,
        "labelIconPosition": "rear",
        "labelTooltip": null,
        "onCreated": "",
        "onMounted": `$api.post('/admin/api/ucenter/get-keycloak-all-users', {}).then(
            res => {
                res = res.data.data
                const result = res.map(item => ({value: item.userId || item.username,label: item.username}))
                result.sort((a, b) => a.label.localeCompare(b.label))
                this.loadOptions(result)
             }).catch(err => {
                console.log(err)
             })`,
        "onRemoteQuery": "",
        "onChange": "",
        "onFocus": "",
        "onBlur": "",
        "onValidate": ""
    },
    "id": "select26617"
})


export const CurrentUserInputField = () => {
    return {
        "type": "input",
        "icon": "text-field",
        "formItemFlag": true,
        "options": {
            "name": "user_creator_id",
            "label": "user_creator_id",
            "labelZh": "",
            "labelAlign": "",
            "type": "text",
            "defaultValue": "",
            "placeholder": "",
            "columnWidth": "200px",
            "size": "",
            "labelWidth": null,
            "labelHidden": false,
            "readonly": false,
            "disabled": false,
            "hidden": true,
            "clearable": true,
            "showPassword": false,
            "required": false,
            "requiredHint": "",
            "validation": "",
            "validationHint": "",
            "customClass": [],
            "labelIconClass": null,
            "labelIconPosition": "rear",
            "labelTooltip": null,
            "minLength": null,
            "maxLength": null,
            "showWordLimit": false,
            "prefixIcon": "",
            "suffixIcon": "",
            "appendButton": false,
            "appendButtonDisabled": false,
            "buttonIcon": "el-icon-search",
            "onCreated": "",
            "onMounted": "const user = $getCookie('docpal-user');\nthis.setValue(user.id||user.username)\n",
            "onInput": "",
            "onChange": "",
            "onFocus": "",
            "onBlur": "",
            "onValidate": ""
        },
        "id": "input113522"
    }

}


export const CurrentUserNameInputField = () => {
    return {
        "type": "input",
        "icon": "text-field",
        "formItemFlag": true,
        "options": {
            "name": "user_creator_id",
            "label": "user_creator_id",
            "labelZh": "",
            "labelAlign": "",
            "type": "text",
            "defaultValue": "",
            "placeholder": "",
            "columnWidth": "200px",
            "size": "",
            "labelWidth": null,
            "labelHidden": false,
            "readonly": false,
            "disabled": false,
            "hidden": true,
            "clearable": true,
            "showPassword": false,
            "required": false,
            "requiredHint": "",
            "validation": "",
            "validationHint": "",
            "customClass": [],
            "labelIconClass": null,
            "labelIconPosition": "rear",
            "labelTooltip": null,
            "minLength": null,
            "maxLength": null,
            "showWordLimit": false,
            "prefixIcon": "",
            "suffixIcon": "",
            "appendButton": false,
            "appendButtonDisabled": false,
            "buttonIcon": "el-icon-search",
            "onCreated": "",
            "onMounted": "const user = $getCookie('docpal-user');\nif(!!user.firstName && !!user.lastName) this.setValue(user.firstName + ' ' + user.lastName)\nelse this.setValue(user.id || user.username )\n",
            "onInput": "",
            "onChange": "",
            "onFocus": "",
            "onBlur": "",
            "onValidate": ""
        },
        "id": "input113522"
    }

}


export const GetApproveUserList = (processKey:string,taskDefinitionKey:string) => {
    return "this.loadOptions([])\n$api.post('/docpal/workflow/task/candidatesByTaskDefinitionKey?taskDefinitionKey="+ taskDefinitionKey +"&processKey=" +   processKey + "', {}, { baseURL: '/client'}).then(res => {\n   res = res.data.data\n  const reponse = res.map(item => ({\n    value: item.userId,\n    label: `${item.username}<${item.email}>`\n  }))\n  this.loadOptions(reponse)\n}).catch(err => {\n})"
}

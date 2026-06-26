

export default defineI18nLocale((locale:string) => {
    const basic = {
        loading: "Loading...",
        'en-US':"ENG",
        'zh-CN':'簡',
        'zh-HK':"繁",
        auditLog_empty: "No audit logs",
        auditLog_loadError: "Failed to load audit log",
        auditLog_toggleDetails: "Toggle audit log details",
        auditLog_title: "Audit Log",
        auditLog_unknownDate: "Unknown date",
        common_goToSourceTable: "Go to Source Table",
        common_form: "Form",
        common_moveUp: "Move up",
        common_moveDown: "Move down"
    }
    switch(locale){
        case 'zh-CN':
            return {
                // ...zhCN,
                ...basic
            }
        case 'en-US':
            return {
                // ...enUS,
                ...basic
            }
        case 'zh-HK':
            return {
                // ...zhHK,
                ...basic
            }
    }
})

export const listenCmd = {
    svcStart: 'program-start-viewToMain',
    svcAwaken: 'program-awaken-viewToMain',
    svcPlaydead: 'program-playdead-viewToMain',
    viewCompleted: 'view-loaded-viewToMain',
}

export const invokeCmd = {
    svcStatusQuery: 'program-status-viewToMain',
    programUpdateQuery: 'program-updateQuery-viewToMain',
    updateLocalServer: 'program_updateSvc_viewToMain',
    versionViewQuery: 'version-view-viewToMain',
    versionSvcQuery: 'version-svc-viewToMain',
    versionMarkdown: 'version-desc-viewToMain',
    queryClientAddr: 'clienturl-get-viewToMain',
    setClientAddr: 'clienturl-set-viewToMain',
    querySvcLogAddr: 'log-svc-viewToMain',
    queryLocalLogAddr: 'log-local-viewToMain',
    queryComponents: 'component-queryAll-viewToMain',
    queryComponentUpdate: 'component-queryUpdate-viewToMain',
    queryOrderComUpdate: 'component-queryOrderUpdate-viewToMain',
    updateOrderComponent: 'component-orderUpdate-viewToMain',
    updateAllComponent: 'component-updateAll-viewToMain',
    updateMainView: 'program_updateView_viewToMain',
}

export const sentCmd = {
    svcStatus: 'program-status-mainToView',
}
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    saveDiary: (diaryText) => ipcRenderer.send('save', diaryText),
    loadDiary: (resultsStr) => ipcRenderer.send('load', resultsStr),
    onSaved: (callback) => ipcRenderer.on('saved', callback),
    onLoaded: (callback) => ipcRenderer.on('loaded', (event, results) => callback(event, results)),
});

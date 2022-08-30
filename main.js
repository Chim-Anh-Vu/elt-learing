const { app, BrowserWindow, ipcMain } = require('electron')
const {download} = require('electron-dl')
const path = require('path')
const fs = require('fs')

let DOWNLOAD_FOLDER = 'DownloadFiles'
let INSTALL_FOLDER = 'installer'
let vagrant_msi_url = ''
let VAGRANT_FILE = 'vagrant_install.msi'
let vbox_url = ''
let VBOX_FILE = 'VirtualBox.exe'
let cent_box = ''
let CENTOS = 'centos7.box'

let VAGRANT_INSTALL_CMD = ['msiexec /qn /i', 'VAGRANTAPPDIR=', '--norestart']
let VBOX_INSTALL_CMD = ['--silent', '--ignore-reboot']


function createDirectory(directory_name) {
    if(!fs.existsSync(directory_name)){
        console.log('Creating folder: '+ directory_name)
        fs.mkdirSync(directory_name)
        console.log('Created folder ' + directory_name)
    }
}


function downloadFile(url, filename) {
    if(!fs.existsSync(path.join(DOWNLOAD_FOLDER, filename))) {
        let win = BrowserWindow.getFocusedWindow()
        download(win, url, {
            directory: DOWNLOAD_FOLDER,
            filename: filename
        })
    }
}

function createWindow() {
    const mainWindow = new BrowserWindow({
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        },
        width: 400,
        height: 300,
        autoHideMenuBar: true,
        center: true,
        resizable: false,

    })

    ipcMain.on('activation', (event, title) => {
        console.log(title)
        createDirectory(DOWNLOAD_FOLDER)
        createDirectory(INSTALL_FOLDER)
    })

    mainWindow.loadFile('index.html')
}

app.whenReady().then(() => {
    createWindow()

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit()
})
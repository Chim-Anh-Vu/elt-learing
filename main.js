const { app, BrowserWindow, ipcMain } = require('electron')
const {download} = require('electron-dl')
const path = require('path')
const fs = require('fs')
const child_process = require('child_process')
const {spawn} = child_process

const DOWNLOAD_FOLDER = 'DownloadFiles'
const INSTALL_FOLDER = 'installer'
const vagrant_msi_url = 'https://releases.hashicorp.com/vagrant/2.3.0/vagrant_2.3.0_windows_amd64.msi'
const VAGRANT_FILE = 'vagrant_install.msi'
const vbox_url = 'https://download.virtualbox.org/virtualbox/6.1.36/VirtualBox-6.1.36-152435-Win.exe'
const VBOX_FILE = 'VirtualBox.exe'
const cent_box_url = 'https://cloud.centos.org/centos/7/vagrant/x86_64/images/CentOS-7-x86_64-Vagrant-2004_01.VirtualBox.box'
const CENTOS = 'centos7.box'

const vagrant_msi_abs_path = path.join(__dirname, DOWNLOAD_FOLDER, VAGRANT_FILE);
const vbox_install_abs_path = path.join(__dirname, DOWNLOAD_FOLDER, VBOX_FILE);
const centos_box_abs_path = path.join(__dirname, DOWNLOAD_FOLDER, CENTOS);
const VBOX_INSTALL_CMD = '--silent --ignore-reboot'
const VAGRANT_INSTALL_CMD = 'msiexec /qn /i /norestart ' + vagrant_msi_abs_path + 'VAGRANTAPPDIR=' + __dirname;
const VAGRANT_CONFIG_FILE_NAME = 'Vagrantfile';

const VAGRANT_CONFIGURATION = 
`# -*- mode: ruby -*-
# vi: set ft=ruby :

Vagrant.configure("2") do |config|
  config.vm.box = "centos7"

  config.vm.provider "virtualbox" do |vb|
    vb.gui = true
  end
end
`;

async function installVagrant() {
    await spawn('msiexec', ['/quiet', vagrant_msi_abs_path, 'VAGRANTAPPDIR=' + __dirname]);
    return 1;
}
async function installVbox() {
    await spawn(vbox_install_abs_path, ['--silent', '--ignore-reboot']);
    return 1;
}



async function creatFile(filename) {
    await fs.writeFileSync(filename, VAGRANT_CONFIGURATION);
    return 1;
}

async function addBoxAndShow() {
    const exe_abs_path = path.join(__dirname, 'bin', 'vagrant.exe');
    await spawn(exe_abs_path, ['box', 'add', path.join(DOWNLOAD_FOLDER, CENTOS), '--name', 'centos7']);
    await spawn(exe_abs_path, ['init']);
   
    await creatFile(VAGRANT_CONFIG_FILE_NAME);
    await spawn(exe_abs_path, ['up'])
    return 1;
}

async function createDirectory(directory_name) {
    if(!fs.existsSync(directory_name)){
        console.log('Creating folder: '+ directory_name);
        fs.mkdirSync(directory_name);
        console.log('Created folder ' + directory_name);
    }
    return 1;
}



async function downloadFile(url, filename) {
    if(!fs.existsSync(path.join(DOWNLOAD_FOLDER, filename))) {
        let win = BrowserWindow.getFocusedWindow();
        const download_item = await download(win, url, {
            directory: path.join(__dirname, DOWNLOAD_FOLDER),
            filename: filename,
            onCompleted: (a)=>{console.log(a);}
        });
        console.log(download_item.getFilename());

        return 1;
    }
}

async function downloadFiles() {
    let a = await downloadFile(vbox_url, VBOX_FILE);
    console.log('3');
    a = await downloadFile(vagrant_msi_url, VAGRANT_FILE);
    console.log('4');
    a = await downloadFile(cent_box_url, CENTOS);
    console.log('5');
    return 1;
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

    });

    ipcMain.on('activation', async (event, title) => {
        console.log(title);
        
        let a = await createDirectory(DOWNLOAD_FOLDER);
        console.log('1');
        a = await createDirectory(INSTALL_FOLDER);
        console.log('2');
        a = await downloadFiles();
        a = await installVagrant();
        console.log('6');
        a = await installVbox();
        console.log('7');
        a = await addBoxAndShow();
        console.log('8');

    });

    mainWindow.loadFile('index.html');
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    })
})

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
})
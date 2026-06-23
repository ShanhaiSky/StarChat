const { app, BrowserWindow, Menu } = require('electron')
const path = require('path')

const isDev = !app.isPackaged

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: 'StarChat',
    icon: path.join(__dirname, '../public/vite.svg'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      // 允许加载本地文件
      webSecurity: false,
    },
    autoHideMenuBar: true,
  })

  if (isDev) {
    win.loadURL('http://localhost:13100')
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  Menu.setApplicationMenu(null)
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

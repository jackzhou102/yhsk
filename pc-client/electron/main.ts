import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import { machineIdSync } from './machineId'

let win: BrowserWindow | null = null

function createWindow() {
  win = new BrowserWindow({
    width: 900,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    frame: false,
    titleBarStyle: 'hidden',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  })

  // 开发环境加载 vite 开发服务器
  const isDev = !app.isPackaged
  if (isDev) {
    win.loadURL('http://localhost:5175')
    win.webContents.openDevTools()
  } else {
    win.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
}

// IPC 处理
ipcMain.handle('get-machine-id', async () => {
  try {
    const id = await machineIdSync()
    return { success: true, data: id }
  } catch (error: any) {
    return { success: false, message: error.message }
  }
})

ipcMain.handle('minimize-window', () => {
  win?.minimize()
})

ipcMain.handle('maximize-window', () => {
  if (win?.isMaximized()) {
    win.unmaximize()
  } else {
    win?.maximize()
  }
})

ipcMain.handle('close-window', () => {
  win?.close()
})

ipcMain.handle('get-app-path', () => {
  return app.getPath('userData')
})

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
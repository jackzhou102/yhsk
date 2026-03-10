<template>
  <div class="app-container">
    <!-- 自定义标题栏 -->
    <div class="title-bar">
      <div class="title-bar-drag">
        <el-icon :size="20"><Key /></el-icon>
        <span>YHSK 授权工具</span>
      </div>
      <div class="title-bar-controls">
        <el-button link @click="minimizeWindow">
          <el-icon :size="16"><Minus /></el-icon>
        </el-button>
        <el-button link @click="maximizeWindow">
          <el-icon :size="16"><FullScreen /></el-icon>
        </el-button>
        <el-button link @click="closeWindow" class="close-btn">
          <el-icon :size="16"><Close /></el-icon>
        </el-button>
      </div>
    </div>

    <!-- 主内容 -->
    <div class="main-content">
      <router-view />
    </div>
  </div>
</template>

<script setup lang="ts">
declare global {
  interface Window {
    electronAPI: {
      getMachineId: () => Promise<{ success: boolean; data?: string; message?: string }>
      minimizeWindow: () => Promise<void>
      maximizeWindow: () => Promise<void>
      closeWindow: () => Promise<void>
      getAppPath: () => Promise<string>
    }
  }
}

const minimizeWindow = () => window.electronAPI?.minimizeWindow()
const maximizeWindow = () => window.electronAPI?.maximizeWindow()
const closeWindow = () => window.electronAPI?.closeWindow()
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #app {
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  overflow: hidden;
}

.app-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.title-bar {
  height: 36px;
  background: rgba(0, 0, 0, 0.2);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 8px;
  -webkit-app-region: drag;
}

.title-bar-drag {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #fff;
  font-size: 13px;
  font-weight: 500;
}

.title-bar-controls {
  display: flex;
  gap: 4px;
  -webkit-app-region: no-drag;
}

.title-bar-controls .el-button {
  color: rgba(255, 255, 255, 0.8);
  width: 28px;
  height: 28px;
}

.title-bar-controls .el-button:hover {
  background: rgba(255, 255, 255, 0.1);
}

.title-bar-controls .close-btn:hover {
  background: #e81123;
  color: #fff;
}

.main-content {
  flex: 1;
  overflow: auto;
}
</style>
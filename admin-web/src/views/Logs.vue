<template>
  <div class="logs-page">
    <el-card shadow="never">
      <!-- 工具栏 -->
      <div class="toolbar">
        <div class="toolbar-left">
          <el-select v-model="actionFilter" placeholder="操作类型" clearable style="width: 150px;">
            <el-option label="验证" value="verify" />
            <el-option label="绑定" value="bind" />
            <el-option label="解绑" value="unbind" />
            <el-option label="撤销" value="revoke" />
          </el-select>
          <el-select v-model="resultFilter" placeholder="结果" clearable style="width: 120px; margin-left: 12px;">
            <el-option label="成功" value="success" />
            <el-option label="失败" value="failed" />
          </el-select>
        </div>
        <div class="toolbar-right">
          <el-button @click="loadLogs">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </div>

      <!-- 日志列表 -->
      <el-table :data="filteredLogs" style="width: 100%" v-loading="loading">
        <el-table-column prop="license_key" label="授权码" width="200">
          <template #default="{ row }">
            <el-text v-if="row.license_key" type="primary" style="font-family: monospace;">
              {{ row.license_key }}
            </el-text>
            <el-text v-else type="info">-</el-text>
          </template>
        </el-table-column>
        <el-table-column prop="machine_code" label="机器码" width="280">
          <template #default="{ row }">
            <el-text style="font-family: monospace; font-size: 12px;">
              {{ row.machine_code || '-' }}
            </el-text>
          </template>
        </el-table-column>
        <el-table-column prop="action" label="操作" width="100">
          <template #default="{ row }">
            <el-tag :type="getActionTagType(row.action)" size="small">
              {{ getActionName(row.action) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="result" label="结果" width="80">
          <template #default="{ row }">
            <el-tag :type="row.result === 'success' ? 'success' : 'danger'" size="small">
              {{ row.result === 'success' ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="ip_address" label="IP地址" width="140" />
        <el-table-column prop="message" label="消息" min-width="200">
          <template #default="{ row }">
            <el-text>{{ row.message || '-' }}</el-text>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import dayjs from 'dayjs'
import api from '@/api'

const loading = ref(false)
const logs = ref<any[]>([])
const actionFilter = ref('')
const resultFilter = ref('')

const filteredLogs = computed(() => {
  let result = logs.value
  if (actionFilter.value) {
    result = result.filter(l => l.action === actionFilter.value)
  }
  if (resultFilter.value) {
    result = result.filter(l => l.result === resultFilter.value)
  }
  return result
})

const loadLogs = async () => {
  loading.value = true
  try {
    const res = await api.logs.list(200)
    if (res.success) {
      logs.value = res.data
    }
  } finally {
    loading.value = false
  }
}

const formatDate = (date: string) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

const getActionName = (action: string) => {
  const map: Record<string, string> = {
    verify: '验证',
    bind: '绑定',
    unbind: '解绑',
    revoke: '撤销'
  }
  return map[action] || action
}

const getActionTagType = (action: string) => {
  const map: Record<string, string> = {
    verify: 'primary',
    bind: 'success',
    unbind: 'warning',
    revoke: 'danger'
  }
  return map[action] || 'info'
}

onMounted(() => {
  loadLogs()
})
</script>

<style scoped>
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
</style>
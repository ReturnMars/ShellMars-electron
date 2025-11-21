<template>
  <div>
    <div class="trigger-wrapper" @click="openModal">
      <slot>
        <n-button size="small">新增</n-button>
      </slot>
    </div>
    <n-modal v-model:show="show" preset="card" class="max-w-50vw">
      <template #header>
        <div class="modal-header">
          <n-text>新增连接</n-text>
        </div>
      </template>
      <div class="modal-content">
        <n-form label-placement="top" ref="formRef" :model="form" :rules="rules">
          <n-form-item label="连接名称" path="name">
            <n-input v-model:value="form.name" placeholder="请输入连接名称" />
          </n-form-item>
          <n-form-item label="连接主机" path="ip">
            <n-input-group>
              <n-input-group-label>IP地址</n-input-group-label>
              <n-input v-model:value="form.ip" placeholder="请输入IP地址" />
              <n-input-group-label>端口</n-input-group-label>
              <n-input-number
                v-model:value="form.port"
                class="!w-48"
                :show-button="false"
                :precision="0"
                :min="1"
                :max="65535"
                placeholder="1 ~ 65535"
              />
            </n-input-group>
          </n-form-item>
          <n-form-item label="用户名" path="username">
            <n-input v-model:value="form.username" placeholder="请输入用户名" />
          </n-form-item>
          <n-form-item label="密码" path="password">
            <n-input
              v-model:value="form.password"
              type="password"
              placeholder="请输入密码"
              show-password-on="click"
            />
          </n-form-item>
        </n-form>
      </div>
      <template #footer>
        <n-flex justify="end">
          <n-button @click="closeModal">取消</n-button>
          <n-button type="info" @click="testConnection">测试连接</n-button>
          <n-button type="primary" @click="submitForm">确定</n-button>
        </n-flex>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { Ref, ref, useTemplateRef } from 'vue'
import { useMessage } from 'naive-ui'
import { SessionItem, SessionStatus } from '@renderer/store/modules/LinkStore/type'
import { toPlainObject } from '@renderer/utils/serialize'
import { useLinkStore } from '@renderer/store/modules/LinkStore'
const message = useMessage()
const show = ref(false)
const linkStore = useLinkStore()
const baseForm = {
  id: '',
  name: 'wzd',
  ip: '47.109.195.0',
  port: 22,
  username: 'root',
  password: 'Aioreturn@123',
  status: SessionStatus.INFO
}
const form: Ref<SessionItem> = ref(structuredClone(baseForm))

const formRef = useTemplateRef('formRef')

const rules = {
  name: { required: true, message: '请输入连接名称' },
  ip: { required: true, message: '请输入IP地址' },
  port: { required: true, message: '请输入端口' },
  username: { required: true, message: '请输入用户名' },
  password: { required: true, message: '请输入密码' }
}

const openModal = () => {
  show.value = true
}

const closeModal = () => {
  show.value = false
  // 重置表单
  form.value = structuredClone(baseForm)
}

const testConnection = async () => {
  // 验证表单
  await formRef.value?.validate?.()
  try {
    const sessionItem: SessionItem = toPlainObject(form)
    const result = await window.ipc.ssh.connect({ linkItem: sessionItem })
    if (result.success) {
      message.success('连接成功！')
      // 测试连接后立即断开
      await window.ipc.ssh.disconnect({ sessionId: result.sessionId })
    } else {
      message.error(result.error || '连接失败，请检查连接信息')
    }
  } catch (error: any) {
    message.error(error?.message || '连接失败，请检查连接信息')
  } finally {
  }
}

const submitForm = async () => {
  // TODO: 实现保存连接逻辑
  console.log('🚀 ~ submitForm ~ form:', linkStore)
  try {
    await linkStore.addSessionItem(form.value)
    closeModal()
  } catch (error: any) {
    message.error(error?.message || '保存失败')
  } finally {
    // closeModal()
  }
}
</script>
<style scoped lang="scss">
.modal-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
</style>

<template>
    <div
    :class="['sidebar-container', collapsed ? 'collapsed' : 'expanded']"      
    >
      <!-- Botão para colapsar -->
      <div class="flex justify-center mt-4 mb-6">
        <el-tooltip
          :content="collapsed ? 'Abrir barra lateral' : 'Fechar barra lateral'"
          placement="right"
        >
          <el-button
            @click="toggleSidebar"
            circle
            size="small"
            class="bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white border-none"
          >
            <el-icon><Expand /></el-icon>
          </el-button>
        </el-tooltip>
      </div>
  
      <!-- Menu com dois estilos -->
      <el-menu
        :default-active="activeRoute"
        :collapse="collapsed"
        router
        background-color="#1f1f1f"
        text-color="#ffffff"
        active-text-color="#409EFF"
        :class="collapsed ? 'menu-collapsed' : 'menu-expanded'"
      >
      <el-menu-item index="/recent">
          <el-icon><Clock /></el-icon>
          <template #title>Reportes Recentes</template>
        </el-menu-item>

        <el-menu-item index="/dashboard">
          <el-icon><Document /></el-icon>
          <template #title>Dashboard</template>
        </el-menu-item>
  
        <el-menu-item index="/settings">
          <el-icon><Setting /></el-icon>
          <template #title>Settings</template>
        </el-menu-item>
      </el-menu>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, defineProps, defineEmits, watch } from 'vue'
  import { useRoute } from 'vue-router'
  import {
    Expand,
    Document,
    Location,
    Clock,
    Setting
  } from '@element-plus/icons-vue'
  
  const props = defineProps({
    collapsed: Boolean
  })
  const emit = defineEmits(['update:collapsed'])

  const collapsed = ref(props.collapsed ?? false)
  const route = useRoute()
  const activeRoute = computed(() => route.path)

  function toggleSidebar() {
    collapsed.value = !collapsed.value
    emit('update:collapsed', collapsed.value)
  }

  watch(() => props.collapsed, (val) => {
    if (typeof val === 'boolean') collapsed.value = val
  })
  </script>  
  
  <style scoped>
.sidebar-container {
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  background-color: #1f1f1f;
  color: white;
  border-right: 1px solid #2a2a2a;
  display: flex;
  flex-direction: column;
  z-index: 50;
  transition: width 0.3s ease;
  overflow: hidden; 
}

.sidebar-container.expanded {
  width: 200px;
}

.sidebar-container.collapsed {
  width: 64px;
}

.menu {
  flex: 1;
  width: 100%;       
  border-right: none; 
  background-color: inherit;
}

.el-menu {
  border-right: none !important; 
}

.collapse-button {
  display: flex;
  justify-content: center;
  margin-top: 1rem;
  margin-bottom: 1.5rem;
}

.collapse-btn {
  background-color: #2a2a2a;
  color: white;
  border: none;
}

.collapse-btn:hover {
  background-color: #3a3a3a;
}
</style>

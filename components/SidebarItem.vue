<template>
    <!-- Colapsado: ícone com tooltip -->
    <el-tooltip v-if="collapsed" :content="label" placement="right">
      <NuxtLink
        :to="to"
        class="flex justify-center items-center p-3 rounded-lg hover:bg-[#2a2a2a] transition"
      >
        <el-icon><component :is="icon" /></el-icon>
      </NuxtLink>
    </el-tooltip>
  
    <!-- Expandido: ícone + nome -->
    <NuxtLink
      v-else
      :to="to"
      class="flex items-center gap-3 p-3 rounded-lg hover:bg-[#2a2a2a] transition text-sm"
    >
      <el-icon><component :is="icon" /></el-icon>
      <span>{{ label }}</span>
    </NuxtLink>
  </template>
  
  <script setup>
  defineProps({
    to: String,
    icon: Object,
    label: String,
    collapsed: Boolean
  })
  </script>
  
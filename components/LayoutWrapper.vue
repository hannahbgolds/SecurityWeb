<template>
    <div class="flex h-screen">
      <Sidebar />
      <main class="flex-1 bg-[#121212] text-white p-6 overflow-y-auto">
        <slot />
      </main>
    </div>
  </template>
  
  <script setup>
  import Sidebar from '~/components/Sidebar.vue'
  </script>
  
  
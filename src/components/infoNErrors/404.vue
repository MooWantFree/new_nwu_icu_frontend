<template>
  <div class="min-h-screen bg-gray-100 flex flex-col justify-center items-center">
    <div class="text-center">
      <h1 class="text-6xl font-bold text-gray-800 mb-4">404</h1>
      <p class="text-2xl text-gray-600 mb-8">哎呀！页面不见了</p>
      <router-link 
        to="/" 
        class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition duration-300"
      >
        回到主页
      </router-link>
    </div>
  </div>
</template>

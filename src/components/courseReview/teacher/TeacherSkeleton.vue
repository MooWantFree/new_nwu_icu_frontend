<template>
    <div class="bg-gray-100 min-h-screen py-8">
      <div class="container mx-auto px-4">
        <div class="bg-white rounded-lg shadow-md p-6 mb-6 animate-pulse">
          <div class="flex items-center mb-4">
            <div class="w-20 h-20 bg-gray-300 rounded-full"></div>
            <div class="ml-4">
              <div class="h-8 bg-gray-300 rounded w-48 mb-2"></div>
              <div class="h-4 bg-gray-300 rounded w-32"></div>
            </div>
          </div>
          <div class="h-4 bg-gray-300 rounded w-3/4 mx-5 mb-4"></div>
          <div class="h-4 bg-gray-300 rounded w-1/2 mx-5"></div>
        </div>

        <div class="bg-white rounded-lg shadow-md p-6 mb-6">
          <div class="h-6 bg-gray-300 rounded w-40 mb-4"></div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div v-for="i in 4" :key="i" class="border rounded-lg p-6 shadow-sm">
              <div class="h-5 bg-gray-300 rounded w-3/4 mb-2"></div>
              <div class="h-4 bg-gray-300 rounded w-1/2 mb-2"></div>
              <div class="h-4 bg-gray-300 rounded w-full mb-4"></div>
              <div class="flex justify-between items-start mb-2">
                <div class="h-4 bg-gray-300 rounded w-1/3"></div>
                <div class="flex flex-col items-end">
                  <div class="h-4 bg-gray-300 rounded w-24 mb-1"></div>
                  <div class="h-4 bg-gray-300 rounded w-24"></div>
                </div>
              </div>
              <div class="flex justify-between items-center">
                <div class="h-4 bg-gray-300 rounded w-1/4"></div>
                <div class="h-8 bg-gray-300 rounded w-20"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  

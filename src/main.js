import { createApp } from 'vue'
import App from './App.vue'
import Router from './router/Router'
import naive from 'naive-ui'
import VueApexCharts from 'vue3-apexcharts'
import '@/style/style.css'

const app = createApp(App)
app.use(Router)
app.use(VueApexCharts)
app.use(naive).mount('#app')

import {createApp} from 'vue';
import Router from "./router/Router";
import App from './App.vue';
import naive from "naive-ui";
import "@/style/style.css"
import VueApexCharts from 'vue3-apexcharts'

const app = createApp(App);
app.use(Router);
app.use(VueApexCharts);
app.use(naive).mount('#app');

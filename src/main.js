import {createApp} from 'vue';
import Antd from 'ant-design-vue';
import Router from "./router/Router";
import App from './App.vue';
import 'ant-design-vue/dist/reset.css';

const app = createApp(App);
app.use(Router);
app.use(Antd).mount('#app');

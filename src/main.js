import {createApp} from 'vue';
import Router from "./router/Router";
import App from './App.vue';
import naive from "naive-ui";
import "./css/tailwindcss.css"

const app = createApp(App);
app.use(Router);
app.use(naive).mount('#app');

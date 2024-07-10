import { createRouter, createWebHistory } from "vue-router";
import Home from "../views/Home.vue";
import About from "../views/About.vue";

const routes = [
    { path: "/", component: Home },
    { path: "/about", component: About },
];

const Router = createRouter({
    history: createWebHistory(),
    routes,
});

export default Router;

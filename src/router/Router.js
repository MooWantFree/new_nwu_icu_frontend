import { createRouter, createWebHistory } from "vue-router";
import Home from "@/views/Home.vue";
import About from "@/views/About.vue";
import Download from "@/views/Download.vue";
import Review from "@/views/Review.vue";

const routes = [
    { path: "/", component: Home },
    { path: "/about", component: About },
    { path: "/download", component: Download },
    { path: "/review", component: Review },
];

const Router = createRouter({
    history: createWebHistory(),
    routes,
});

export default Router;

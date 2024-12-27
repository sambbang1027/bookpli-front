import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "./assets/styles/font.css";
import "./assets/styles/main.css";

import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";
import Header from "./components/layouts/Header.vue";
import apiClient from "./api/axiosInstance";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";

const app = createApp(App);
const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

app.use(pinia);
app.use(router);

//공용 컴포넌트 등록
app.component("Header", Header);

app.config.globalProperties.axios = apiClient;
app.mount("#app");

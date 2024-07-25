import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
// import VCalendar from 'v-calendar';
// import 'v-calendar/dist/style.css';
import '@/assets/global.css'

const app = createApp(App);
app.use(router);
app.use(ElementPlus);
// app.use(VCalendar);

app.mount('#app');

createApp(App).use(router).mount('#app');


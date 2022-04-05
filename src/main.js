import Vue from 'vue';
import IconCrypto from 'vue-cryptocurrency-icons';
import App from './App.vue';

import './plugins/bootstrap-vue';
import './assets/scss/style.scss';

Vue.use(IconCrypto);

Vue.use(IconCrypto);

Vue.config.productionTip = false;

new Vue({
    render: (h) => h(App),
}).$mount('#app');
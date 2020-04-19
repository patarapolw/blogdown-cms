import Vue from 'vue'
import Dialog from 'primevue/dialog'
import Chips from 'primevue/chips'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'

import 'primevue/resources/themes/nova-light/theme.css' // theme
import 'primevue/resources/primevue.min.css' // shared css
import 'primeicons/primeicons.css' // icons

Vue.component('p-dialog', Dialog)
Vue.component('p-chips', Chips)
Vue.component('p-data-table', DataTable)
Vue.component('p-column', Column)

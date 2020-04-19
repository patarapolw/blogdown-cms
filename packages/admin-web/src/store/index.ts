import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export const store = new Vuex.Store({
  state: {
    isLoading: false,
    errorMsg: ''
  },
  mutations: {
    setLoading (state, isLoading) {
      state.isLoading = isLoading
    },
    setErrorMsg (state, msg) {
      state.errorMsg = msg
    }
  }
})

export default store

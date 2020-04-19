import axios from 'axios'

import { store } from './store'

const api = axios.create({
  baseURL: `http://localhost:${process.env.VUE_APP_SERVER_PORT}`
})

api.interceptors.request.use((config) => {
  store.commit('setLoading', true)
  return config
})

api.interceptors.response.use((config) => {
  store.commit('setLoading', false)
  return config
}, (err) => {
  store.commit('setLoading', false)
  store.commit('setErrorMsg', err.message)
  return err
})

export default api

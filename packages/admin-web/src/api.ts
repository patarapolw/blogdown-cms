import axios from 'axios'

import { store } from './store'

let setLoadingHandle: NodeJS.Timeout | null = null

export function getApi (opts: { silent: boolean }) {
  const api = axios.create({
    baseURL: `http://localhost:${process.env.VUE_APP_SERVER_PORT}`
  })

  if (!opts.silent) {
    api.interceptors.request.use((config) => {
      setLoadingHandle = setTimeout(() => {
        store.commit('setLoading', true)
      }, 1000)

      return config
    })

    api.interceptors.response.use((config) => {
      if (setLoadingHandle) {
        clearTimeout(setLoadingHandle)
      }
      setLoadingHandle = null

      store.commit('setLoading', false)
      return config
    }, (err) => {
      if (setLoadingHandle) {
        clearTimeout(setLoadingHandle)
      }
      setLoadingHandle = null

      store.commit('setLoading', false)
      store.commit('setErrorMsg', err.message)
      return err
    })
  } else {
    api.interceptors.response.use(undefined, (err) => {
      store.commit('setErrorMsg', err.message)
      return err
    })
  }

  return api
}

export const api = getApi({ silent: false })

export default api

import axios from 'axios'
import { SnackbarProgrammatic as Snackbar, LoadingProgrammatic as Loading } from 'buefy'

const api = axios.create({
  baseURL: `http://localhost:${process.env.VUE_APP_SERVER_PORT}`
})

export let loading: {
  close(): any
  requestEnded?: boolean
} | null = null

api.interceptors.request.use((config) => {
  if (!loading) {
    loading = Loading.open({
      isFullPage: true,
      canCancel: true,
      onCancel: () => {
        if (loading && !loading.requestEnded) {
          Snackbar.open('API request is loading in background.')
        }
      }
    })
  }

  return config
})

api.interceptors.response.use((config) => {
  if (loading) {
    loading.requestEnded = true
    loading.close()
    loading = null
  }

  return config
}, (err) => {
  if (loading) {
    loading.close()
    loading = null
  }

  Snackbar.open(err.message)
  return err
})

export default api

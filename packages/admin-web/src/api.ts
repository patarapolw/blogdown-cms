import axios from '@typed-rest/axios'
import { SnackbarProgrammatic as Snackbar, LoadingProgrammatic as Loading } from 'buefy'
import { IPostsApi, IMediaApi } from '@blogdown-cms/admin-api'

const api = axios.create<IPostsApi & IMediaApi>({
  baseURL: process.env.NODE_ENV === 'development' ? `http://localhost:${process.env.VUE_APP_SERVER_PORT}` : '/',
  // validateStatus (status) {
  //   return status >= 200 && status < 300  // default
  // },
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
      },
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

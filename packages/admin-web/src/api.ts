import axios from '@typed-rest/axios'
import { SnackbarProgrammatic as Snackbar } from 'buefy'
import { IPostsApi, IMediaApi } from '@blogdown-cms/admin-api'

const api = axios.create<IPostsApi & IMediaApi>({
  baseURL: process.env.NODE_ENV === 'development' ? `http://localhost:${process.env.VUE_APP_SERVER_PORT}` : '/',
  // validateStatus (status) {
  //   return status >= 200 && status < 300  // default
  // },
})

api.interceptors.response.use(undefined, (err) => {
  Snackbar.open(err.message)
  return err
})

export default api

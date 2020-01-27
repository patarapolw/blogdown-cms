import axios from '@typed-rest/axios'
import { SnackbarProgrammatic as Snackbar } from 'buefy'
import { IPostsApi } from '@blogdown-cms/admin-api/dist/posts'
import { IMediaApi } from '@blogdown-cms/admin-api/dist/media'

const api = axios.create<IPostsApi & IMediaApi>({
  baseURL: `http://localhost:${process.env.VUE_APP_SERVER_PORT}`,
  // validateStatus (status) {
  //   return status >= 200 && status < 300  // default
  // },
})

api.interceptors.response.use(undefined, (err) => {
  console.error(err)
  Snackbar.open(err)
  return err
})

export default api

# Blogdown-CMS

Content Management System, to provide API endpoints for Static Site Generators or JAMStacks

![App preview](/docs/cmsv2.gif)

## Features

- [Extended markdown](/packages/admin-frontend/src/assets/make-html/index.ts#L69)
- [Extended with Handlebars](/packages/admin-frontend/src/assets/make-html/template.ts)
  - For example `{{{github 'patarapolw/blogdown-cms'}}}`
- [Reveal MD](https://github.com/patarapolw/reveal-md) for PowerPoint-esque presentation
- [Tailwind CSS](https://tailwindcss.com/) for styling
  - You might need to [disable preflight](https://tailwindcss.com/docs/preflight/#disabling-preflight) (a CSS normalizer) to enable native Markdown styling

## How it works

This project uses the following endpoints

- MongoDB for storing text-based contents
- Heroku to provide public API endpoints to MongoDB
- _Cloudinary (optional) is used to store media (e.g. images)_
- Editing is only enabled offline
  - via `npm run dev`

## Environmental variables

- All the following environmental variables are optional. If `MONGO_URI` is not provided, it will attempt to use [Docker](https://www.docker.com/), which automatically download [mongo](https://hub.docker.com/_/mongo) image.
- Put the `.env` file inside `/packages/server/`

```sh
PORT=
MONGO_URI=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_CLOUD_NAME=
```

- Client side `.env` will be needed if you want to host Reveal MD, namely `BASE_URL`
- Put the `.env` file inside `/packages/admin-web/`

```sh
BASE_URL=
```

## Running the app

- Development mode -- `npm run dev`
- Building the Docker and run -- `npm run build && npm start`
  - Set environment variable `ADMIN=1` to enable editing
- Deploy to Heroku -- `npm run deploy` (Don't forget to `heroku create` first)

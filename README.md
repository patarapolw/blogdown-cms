# Blogdown-CMS

Content Management System, to provide API endpoints for Static Site Generators or JAMStacks

![App preview](/docs/cmsv2.gif)

## Features

- [Extended markdown](/packages/admin-web/src/assets/make-html/index.ts#L35)
- [Extended with Handlebars](/packages/admin-web/src/assets/make-html/template.ts)
  - `{{{github 'patarapolw/blogdown-cms'}}}` for embedding GitHub links
  - `{{{card url}}}` for embedding link previews with image
  - `{{{pdf url}}}` for embedding PDF
  - `{{{reveal slug}}}` for embedding reveal MD
  - Quoting can be `"` or `'`, and is optional, thanks to [shlex.ts](/packages/admin-web/src/assets/make-html/shlex.ts)
- [Reveal MD](https://github.com/patarapolw/reveal-md) for PowerPoint-esque presentation
- No specific framework is required for styling
  - You might need to disable CSS reset to enable native Markdown styling
- The Heroku hosted REST API exposes an OpenAPI documentation
  - You can see the example doc at <https://patarapolw-blogdown.herokuapp.com/api/doc> thanks to [Fastify OAS](https://github.com/SkeLLLa/fastify-oas).
  - There is a larger doc in development mode (editable API endpoints).
- Search syntax is powered by [patarapow/qsearch](https://github.com/patarapolw/qsearch) via exposed REST API. So, you can query MongoDB with a string instead of JSON.

## How it works

This project uses the following endpoints

- MongoDB for storing text-based contents
- Heroku to provide public API endpoints to MongoDB
- Cloudinary is used to store media (e.g. images)
- Editing is only enabled offline
  - via `npm run dev`

## Environmental variables

- All the following environmental variables, except for `MONGO_URI` are optional. If you need a MongoDB server, you might try MongoDB Atlas or [local docker image](https://hub.docker.com/_/mongo).
- Put the `.env` file inside `/packages/server/`

```sh
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
- Deploy to Heroku -- `npm run deploy` (Don't forget to `heroku create` first)

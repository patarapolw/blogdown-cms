# Blogdown-CMS

Content Management System, to provide API endpoints for Static Site Generators or JAMStacks

![App preview](/docs/preview.gif)

## How it works

This project uses the following endpoints

- MongoDB for storing text-based contents
- Now.sh to provide public API endpoints to MongoDB
  - For example, try sending POST requests to `https://*.now.sh/api/posts`
- GitHub Pages to store media (e.g. images) at no cost
  - For example, try sending GET requests to `https://*.github.io/blogdown-cms/media/*.png`
- Editing is only enable offline (by running `yarn dev` or `yarn build && yarn start`)

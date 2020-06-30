<template>
  <Nuxt />
</template>

<style>
@import 'awsm.css/dist/awsm.css';

section + section {
  margin: initial;
}

html,
body {
  margin: 0;
  padding: 0;
}

.h-full {
  height: 100%;
}

.w-full {
  width: 100%;
}

.flex-grow {
  flex-grow: 1;
}

.grid-cols-1 {
  grid-template-columns: 1fr;
}

.grid-cols-2 {
  grid-template-columns: 1fr 1fr;
}
</style>

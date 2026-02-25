<template>
  <div>
    <NuxtRouteAnnouncer/>
    <div>
      <NuxtLink class="nuxt-link" to="/">Home</NuxtLink>
      <NuxtLink class="nuxt-link" to="/about">About</NuxtLink>
    </div>
    <h1>Welcome to My Nuxt.js App</h1>
    <p>This is the main page of our Nuxt.js application.</p>
  </div>
</template>

<style scoped>
.nuxt-link {
  margin-right: 15px;
  text-decoration: none;
  color: #42b983;
}
</style>
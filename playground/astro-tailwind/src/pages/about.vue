<script setup lang="ts">
const fruits = ["apples", "oranges", "bananas", "cherries", "grapes"];
</script>

<template>
  <div>
    <h1>Hello from Vuecast!</h1>
    <ul>
      <li v-for="(fruit, index) in fruits" :key="index">
        {{ index + 1 }}: {{ fruit }}
      </li>
    </ul>
  </div>
</template>

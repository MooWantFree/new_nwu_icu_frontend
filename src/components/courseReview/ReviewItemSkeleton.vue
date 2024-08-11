<template>
  <div class="all-review-items">
    <div class="review-avatar">
      <n-avatar
          round
          size="large"
      >
      </n-avatar>
    </div>
    <div class="review-container">
      <n-skeleton />
      <br />
      <n-skeleton />
      <br />
      <n-skeleton />
    </div>

  </div>


</template>

<script lang="ts" setup>
</script>

<style scoped>
a {
  text-decoration: none;
}

.all-review-items {
  display: flex;
  padding: 1rem;
  box-shadow: 0 .5em 1em -.125em rgba(10, 10, 10, .1);
  border-radius: 25px;
  margin-top: 1rem;

}

.review-avatar {
  display: block;
  margin-right: 1rem;
}

@media (max-width: 768px) {
  .review-avatar {
    display: block;
  }

}

.review-operation-time {
  display: flex;
  justify-content: space-between;
}

.review-container {
  width: 100%;
}

.review-content {
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  line-clamp: 3;
}

</style>

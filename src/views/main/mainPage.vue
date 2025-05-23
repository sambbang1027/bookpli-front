<template>
  <img src="@/assets/banners/thumbnail2.png" class="main-thumbnail">
  <div class="toggle-container">
    <!-- Toggle Switch -->
    <label class="switch">
      <input type="checkbox" v-model="isMusicSection" @change="handleToggle"/>
      <span class="slider">
                <span class="slider-label left-label" v-show="isMusicSection">Music</span>
                <span class="slider-label right-label" v-show="!isMusicSection">Book</span>
      </span>
    </label>
  </div>

  <!-- Conditional rendering for bookSection and musicSection -->
  <div v-if="!isMusicSection" style="padding-bottom: 100px;">
    <bookSection />
  </div>
  <div v-else-if="authStore.isAuthenticated" style="padding-bottom: 100px;">
    <musicSection />
  </div>
</template>

<script setup>
  import { ref, onMounted } from "vue";
  import { useAuthStore } from '@/stores/auth.js';
  import bookSection from "@/components/bookSection.vue";
  import musicSection from "@/components/musicSection.vue";
  import { useLoginAlertModalStore } from "@/stores/utilModalStore";

  const isMusicSection = ref(false);
  const authStore = useAuthStore();
  const modalStore = useLoginAlertModalStore();

// MusicSection 접근 시 권한 확인
const handleToggle = () => {
  if (isMusicSection.value && !authStore.isAuthenticated) {
    modalStore.showModal(
      '로그인 페이지로 이동',
      '로그인 후 이용해주세요.',
      {
        onConfirm: () => {
          window.location.href = "/login";
        },
        onCancel: () => {
          isMusicSection.value = false;
        },
      }
    );
  }
};
</script>

<style scoped>
/* Toggle Container */
.toggle-container {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 10px 0;
}

/* Toggle Switch Styles */
.switch {
  position: relative;
  display: inline-block;
  width: 150px;
  height: 40px;
}

.switch input {
  opacity: 0;
  width: 150px; /* Ensures input is clickable */
  height: 40px;
  position: absolute; /* Match slider position */
  z-index: 2; /* Ensure it's above the slider */
  cursor: pointer;
}

.slider {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  border-radius: 20px;
  transition: background-color 0.4s;
  display: flex;
  align-items: center;
  justify-content: center;
  color: black;
}

.slider:before {
  position: absolute;
  content: "";
  height: 34px;
  width: 70px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  border-radius: 17px;
  transition: transform 0.4s;
}

input:checked + .slider {
  background-color: #67de86;
}

input:checked + .slider:before {
  transform: translateX(75px);
}

/* Page Labels */
.slider-label {
  position: absolute;
  font-size: 0.9rem;
  font-weight: bold;
  user-select: none;
  transition: opacity 0.4s;
}

/* Specific positions for labels */
.left-label {
  left: 23px; /* Align to the left */
}

.right-label {
  right: 23px; /* Align to the right */
}

.main-thumbnail {
  width: 100%;
}

</style>

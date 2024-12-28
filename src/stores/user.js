import { defineStore } from "pinia";

export const useUserStore = defineStore("user", {
  state: () => ({
    accessToken: null,
  }),
  actions: {
    setAccessToken(accessToken) {
      this.accessToken = accessToken;
    },
    clearAccessToken() {
      this.accessToken = null;
    },
  },
  persist: {
    enabled: true,
    strategies: [
      {
        key: "token", // 로컬스토리지에 저장될 키
        storage: localStorage, // 저장 방식
        paths: ["accessToken"], // state의 accessToken만 저장
      },
    ],
  },
});

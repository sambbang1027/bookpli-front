import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueDevTools from "vite-plugin-vue-devtools";
// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueDevTools()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  // 빌드 출력 디렉토리 설정
  build: {
    outDir: "../src/main/resources/static", // Spring Boot의 정적 리소스 폴더로 설정
    emptyOutDir: true, // 기존 빌드 결과 삭제
  },
  // 개발 서버 설정(배포시에는 효과X)
  server: {
    port: 3000, // 개발 서버 포트 설정
    host: "0.0.0.0", // 모든 네트워크 인터페이스에서 접근 가능
  },
});

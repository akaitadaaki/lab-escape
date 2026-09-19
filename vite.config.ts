import { defineConfig } from 'vite';

// GitHub Pages などサブパス配下でも動くよう、相対パスでビルドする
export default defineConfig({
  base: './',
});

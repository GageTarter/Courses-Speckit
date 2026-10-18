import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vuetify from "vite-plugin-vuetify";
import dns from "dns";

dns.setDefaultResultOrder("verbatim");

export default () => {
  // Production base must match the SPA folder URL on the class server
  // (FRONTEND_DEPLOY_TARGET under /var/www/html/...).
  const baseURL =
    process.env.APP_ENV === "development" ? "/" : "/seiv2026/p3/t5/";
  return defineConfig({
    plugins: [vue(), vuetify({ autoImport: false })],
    server: { host: "localhost", port: 8082 },
    base: baseURL,
  });
};

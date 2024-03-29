import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import viteTsconfigPaths from "vite-tsconfig-paths";
import svgrPlugin from "vite-plugin-svgr";

// https://vitejs.dev/config/
export default defineConfig({
    base: "./",
    plugins: [react(), viteTsconfigPaths(), svgrPlugin()],
    build: {
        sourcemap: true,
    },
    resolve: {
        alias: {
            "@babel/polyfill/lib/noConflict": "./src/dummy-module.js",
        },
    },
    optimizeDeps: {
        esbuildOptions: {
            define: {
                global: "globalThis",
            },
        },
    },
});

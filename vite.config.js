import { defineConfig } from "vite";
import { resolve } from "path";

import vue from "@vitejs/plugin-vue";

// https://vitejs.dev/config/
export default defineConfig({
	build: {
		lib: {
			entry: resolve(__dirname, "lib/index.js"),
			name: "webcel",
			fileName: "webcel",
		},
	},
	rollupOptions: {
		external: ["vue"],
		output: {
			globals: {
				vue: "Vue",
			},
		},
	},
	plugins: [vue()],
});

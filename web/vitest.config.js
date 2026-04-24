import path from "node:path";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "src"),
        },
    },
    test: {
        environment: "jsdom",
        globals: true,
        setupFiles: ["./src/test/setup.ts"],
        css: false,
        coverage: {
            provider: "v8",
            reporter: ["text", "html", "lcov"],
            include: ["src/**/*.{ts,tsx}"],
            exclude: [
                "src/main.tsx",
                "src/test/**",
                "src/**/*.d.ts",
                "src/vite-env.d.ts",
            ],
            thresholds: {
                lines: 90,
                statements: 90,
                functions: 90,
                branches: 85,
            },
        },
    },
});

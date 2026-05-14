import { defineConfig } from "vite";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { copyFileSync, readdirSync, existsSync, mkdirSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));

const pages = [
  "index.html",
  "auth.html",
  "dashboard.html",
  "student_courses.html",
  "assignments.html",
  "grades.html",
  "schedule.html",
  "fees.html",
  "profile.html",
  "admin.html",
];

/** 
 * نسخ جميع الملفات الأساسية (JS, CSS, Images) إلى dist 
 * لضمان عمل الروابط المباشرة في HTML بعد الـ build
 */
function copyAllAssets() {
  return {
    name: "copy-all-assets",
    closeBundle() {
      const outDir = resolve(__dirname, "dist");
      if (!existsSync(outDir)) mkdirSync(outDir);
      
      const files = readdirSync(__dirname);
      files.forEach(file => {
        // نسخ ملفات الـ JS والـ CSS والـ PNG/JPG/SVG/JSON التي ليست في node_modules أو dist
        if (
          (file.endsWith(".js") || file.endsWith(".css") || file.endsWith(".png") || file.endsWith(".jpg") || file.endsWith(".json")) &&
          file !== "package.json" && file !== "package-lock.json" && file !== "firebase.json"
        ) {
          copyFileSync(resolve(__dirname, file), resolve(outDir, file));
        }
      });
    },
  };
}

export default defineConfig({
  base: "./",
  plugins: [copyAllAssets()],
  server: {
    port: 5180,
    strictPort: false,
    open: true,
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: Object.fromEntries(
        pages.map((name) => [name.replace(".html", ""), resolve(__dirname, name)])
      ),
    },
  },
});

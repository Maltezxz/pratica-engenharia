// vite.config.ts
import { defineConfig } from "file:///home/project/node_modules/vite/dist/node/index.js";
import react from "file:///home/project/node_modules/@vitejs/plugin-react/dist/index.mjs";
import { writeFileSync, readFileSync } from "fs";
import { resolve } from "path";
var __vite_injected_original_dirname = "/home/project";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    {
      name: "inject-version",
      closeBundle() {
        const version = Date.now().toString();
        console.log(`Building with version: ${version}`);
        const swPath = resolve(__vite_injected_original_dirname, "dist/sw.js");
        try {
          const swContent = readFileSync(swPath, "utf-8");
          const updatedContent = swContent.replace(/__APP_VERSION__/g, version);
          writeFileSync(swPath, updatedContent);
          console.log("Service Worker version injected successfully");
        } catch (error) {
          console.warn("Could not inject version into service worker:", error);
        }
      }
    }
  ],
  optimizeDeps: {
    exclude: ["lucide-react"]
  },
  publicDir: "public",
  build: {
    outDir: "dist",
    assetsDir: "assets",
    copyPublicDir: true,
    rollupOptions: {
      output: {
        entryFileNames: "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith(".css")) {
            return "assets/[name]-[hash].css";
          }
          return "assets/[name]-[hash][extname]";
        }
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XG5pbXBvcnQgeyB3cml0ZUZpbGVTeW5jLCByZWFkRmlsZVN5bmMgfSBmcm9tICdmcyc7XG5pbXBvcnQgeyByZXNvbHZlIH0gZnJvbSAncGF0aCc7XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIHBsdWdpbnM6IFtcbiAgICByZWFjdCgpLFxuICAgIHtcbiAgICAgIG5hbWU6ICdpbmplY3QtdmVyc2lvbicsXG4gICAgICBjbG9zZUJ1bmRsZSgpIHtcbiAgICAgICAgY29uc3QgdmVyc2lvbiA9IERhdGUubm93KCkudG9TdHJpbmcoKTtcbiAgICAgICAgY29uc29sZS5sb2coYEJ1aWxkaW5nIHdpdGggdmVyc2lvbjogJHt2ZXJzaW9ufWApO1xuXG4gICAgICAgIGNvbnN0IHN3UGF0aCA9IHJlc29sdmUoX19kaXJuYW1lLCAnZGlzdC9zdy5qcycpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGNvbnN0IHN3Q29udGVudCA9IHJlYWRGaWxlU3luYyhzd1BhdGgsICd1dGYtOCcpO1xuICAgICAgICAgIGNvbnN0IHVwZGF0ZWRDb250ZW50ID0gc3dDb250ZW50LnJlcGxhY2UoL19fQVBQX1ZFUlNJT05fXy9nLCB2ZXJzaW9uKTtcbiAgICAgICAgICB3cml0ZUZpbGVTeW5jKHN3UGF0aCwgdXBkYXRlZENvbnRlbnQpO1xuICAgICAgICAgIGNvbnNvbGUubG9nKCdTZXJ2aWNlIFdvcmtlciB2ZXJzaW9uIGluamVjdGVkIHN1Y2Nlc3NmdWxseScpO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgIGNvbnNvbGUud2FybignQ291bGQgbm90IGluamVjdCB2ZXJzaW9uIGludG8gc2VydmljZSB3b3JrZXI6JywgZXJyb3IpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICBdLFxuICBvcHRpbWl6ZURlcHM6IHtcbiAgICBleGNsdWRlOiBbJ2x1Y2lkZS1yZWFjdCddLFxuICB9LFxuICBwdWJsaWNEaXI6ICdwdWJsaWMnLFxuICBidWlsZDoge1xuICAgIG91dERpcjogJ2Rpc3QnLFxuICAgIGFzc2V0c0RpcjogJ2Fzc2V0cycsXG4gICAgY29weVB1YmxpY0RpcjogdHJ1ZSxcbiAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICBvdXRwdXQ6IHtcbiAgICAgICAgZW50cnlGaWxlTmFtZXM6ICdhc3NldHMvW25hbWVdLVtoYXNoXS5qcycsXG4gICAgICAgIGNodW5rRmlsZU5hbWVzOiAnYXNzZXRzL1tuYW1lXS1baGFzaF0uanMnLFxuICAgICAgICBhc3NldEZpbGVOYW1lczogKGFzc2V0SW5mbykgPT4ge1xuICAgICAgICAgIGlmIChhc3NldEluZm8ubmFtZT8uZW5kc1dpdGgoJy5jc3MnKSkge1xuICAgICAgICAgICAgcmV0dXJuICdhc3NldHMvW25hbWVdLVtoYXNoXS5jc3MnO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gJ2Fzc2V0cy9bbmFtZV0tW2hhc2hdW2V4dG5hbWVdJztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfSxcbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUF5TixTQUFTLG9CQUFvQjtBQUN0UCxPQUFPLFdBQVc7QUFDbEIsU0FBUyxlQUFlLG9CQUFvQjtBQUM1QyxTQUFTLGVBQWU7QUFIeEIsSUFBTSxtQ0FBbUM7QUFLekMsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUztBQUFBLElBQ1AsTUFBTTtBQUFBLElBQ047QUFBQSxNQUNFLE1BQU07QUFBQSxNQUNOLGNBQWM7QUFDWixjQUFNLFVBQVUsS0FBSyxJQUFJLEVBQUUsU0FBUztBQUNwQyxnQkFBUSxJQUFJLDBCQUEwQixPQUFPLEVBQUU7QUFFL0MsY0FBTSxTQUFTLFFBQVEsa0NBQVcsWUFBWTtBQUM5QyxZQUFJO0FBQ0YsZ0JBQU0sWUFBWSxhQUFhLFFBQVEsT0FBTztBQUM5QyxnQkFBTSxpQkFBaUIsVUFBVSxRQUFRLG9CQUFvQixPQUFPO0FBQ3BFLHdCQUFjLFFBQVEsY0FBYztBQUNwQyxrQkFBUSxJQUFJLDhDQUE4QztBQUFBLFFBQzVELFNBQVMsT0FBTztBQUNkLGtCQUFRLEtBQUssaURBQWlELEtBQUs7QUFBQSxRQUNyRTtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBLEVBQ0EsY0FBYztBQUFBLElBQ1osU0FBUyxDQUFDLGNBQWM7QUFBQSxFQUMxQjtBQUFBLEVBQ0EsV0FBVztBQUFBLEVBQ1gsT0FBTztBQUFBLElBQ0wsUUFBUTtBQUFBLElBQ1IsV0FBVztBQUFBLElBQ1gsZUFBZTtBQUFBLElBQ2YsZUFBZTtBQUFBLE1BQ2IsUUFBUTtBQUFBLFFBQ04sZ0JBQWdCO0FBQUEsUUFDaEIsZ0JBQWdCO0FBQUEsUUFDaEIsZ0JBQWdCLENBQUMsY0FBYztBQUM3QixjQUFJLFVBQVUsTUFBTSxTQUFTLE1BQU0sR0FBRztBQUNwQyxtQkFBTztBQUFBLFVBQ1Q7QUFDQSxpQkFBTztBQUFBLFFBQ1Q7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=

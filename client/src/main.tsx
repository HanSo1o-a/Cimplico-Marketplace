import { createRoot } from "react-dom/client";
import App from "./App";
// 首先导入主题变量
import "./theme-variables.css";
// 然后导入Tailwind样式
import "./index.css";
// 如果存在编译后的CSS文件，则导入它
try {
  import("./tailwind.css").catch(() => {
    console.log("No compiled tailwind.css found, using index.css directly");
  });
} catch (e) {
  console.log("Error importing tailwind.css:", e);
}
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n";

createRoot(document.getElementById("root")!).render(
  <I18nextProvider i18n={i18n}>
    <App />
  </I18nextProvider>
);

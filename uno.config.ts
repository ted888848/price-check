import presetIcons from "@unocss/preset-icons";
import { defineConfig, presetWind4 } from "unocss";
export default defineConfig({
  presets: [presetWind4(), presetIcons()],
  shortcuts: {
    center: "flex items-center justify-center",
  },
});

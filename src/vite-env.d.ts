/// <reference types="vite/client" />

declare const __APP_VERSION__: string;

interface ImportMetaEnv {
  readonly VITE_GITHUB_REPO?: string;
  readonly VITE_UPDATE_FEED?: string;
  readonly VITE_UPDATE_CHECK?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

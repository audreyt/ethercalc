/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ETHERCALC_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
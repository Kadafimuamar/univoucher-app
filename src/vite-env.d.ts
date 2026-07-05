/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_UNICITY_NETWORK: string;
  readonly VITE_MERCHANT_NAMETAG: string;
  readonly VITE_DAPP_NAME: string;
  readonly VITE_DAPP_DESCRIPTION: string;
  readonly VITE_SPHERE_WALLET_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

import type { CreateClientConfig } from "./gen/client.gen";

export const createClientConfig: CreateClientConfig = (config) => ({
  ...config,
  baseUrl: "",
});

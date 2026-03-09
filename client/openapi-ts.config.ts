import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  input: "../server/src/main/resources/open-api-contract.json",
  output: "src/gen",
  plugins: [
    {
      name: "@hey-api/client-fetch",
      runtimeConfigPath: "../heyApi.ts",
    },
    "@tanstack/react-query",
  ],
});

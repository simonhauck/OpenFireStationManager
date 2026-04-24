import { createFileRoute } from "@tanstack/react-router"

import PoolKlamottenPage from "#/clothing/components/pool-klamotten/PoolKlamottenPage"

export const Route = createFileRoute("/pool-klamotten/")({
  component: PoolKlamottenRoute,
})

function PoolKlamottenRoute() {
  return <PoolKlamottenPage />
}

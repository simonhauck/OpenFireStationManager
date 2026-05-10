import { createFileRoute } from "@tanstack/react-router"

import PoolKlamottenPage from "#/clothing/components/pool-klamotten/PoolKlamottenPage"

export const Route = createFileRoute("/pool-clothing/")({
  component: PoolClothingRoute,
})

function PoolClothingRoute() {
  return <PoolKlamottenPage />
}

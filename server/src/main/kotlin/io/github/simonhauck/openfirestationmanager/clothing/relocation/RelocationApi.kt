package io.github.simonhauck.openfirestationmanager.clothing.relocation

import jakarta.validation.constraints.NotEmpty

data class RelocationRequest(
    val targetLocationId: Long,
    @NotEmpty val itemIds: List<Long>,
)

data class RelocationResponse(val batchId: String)

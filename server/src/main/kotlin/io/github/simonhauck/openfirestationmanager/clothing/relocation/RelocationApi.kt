package io.github.simonhauck.openfirestationmanager.clothing.relocation

data class RelocationRequest(val targetLocationId: Long, val itemIds: List<Long>)

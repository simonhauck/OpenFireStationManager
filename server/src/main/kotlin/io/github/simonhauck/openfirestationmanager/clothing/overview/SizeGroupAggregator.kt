package io.github.simonhauck.openfirestationmanager.clothing.overview

import org.springframework.stereotype.Component

class SizeGroupAggregator {

    private val predefinedGroups = listOf(
        PredefinedSizeGroup("XXXS", 0, "3XS"),
        PredefinedSizeGroup("XXS", 1, "2XS"),
        PredefinedSizeGroup("XS", 2),
        PredefinedSizeGroup("S", 3),
        PredefinedSizeGroup("M", 4),
        PredefinedSizeGroup("L", 5),
        PredefinedSizeGroup("XL", 6),
        PredefinedSizeGroup("XXL", 7, "2XL"),
        PredefinedSizeGroup("XXXL", 8, "3XL"),
    )


    fun group(sizes: List<String>): List<SizeGroupSummary> {
        val values = sizes.groupBy { determineGroup(it) }
            .mapValues { countValues(it.value) }
            .mapValues { sortSizeSummaries(it.value) }

    }

    private fun sortSizeSummaries(value: List<SizeSummary>): List<SizeSummary> {
        value.sortedBy { it.size }
    }

    private fun countValues(value: List<String>): List<SizeSummary> {
        value.groupBy { it }
            .mapValues { it.value.count() }
            .map { SizeSummary(it.key, it.value) }
    }

    private fun determineGroup(size: String): String {
        val predefinedGroupResult = findPredefinedGroupOrNull(size)
        return when {
            size.toIntOrNull() != null -> "#"
            predefinedGroupResult != null -> predefinedGroupResult.name
            else -> "Sonstige"
        }
    }

    private fun findPredefinedGroupOrNull(size: String): PredefinedSizeGroup? {
        return predefinedGroups.find { it.isNameOrAlias(size) }
    }


    private class PredefinedSizeGroup(
        val name: String,
        val order: Int,
        val alias: String? = null
    ) {
        fun isNameOrAlias(value: String): Boolean {
            val matchesName = value.contains(name, true)
            val matchesAlias = alias != null && value.contains(alias, true)

            return matchesName || matchesAlias
        }
    }
}
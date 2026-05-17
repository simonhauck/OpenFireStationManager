package io.github.simonhauck.openfirestationmanager.clothing.overview

class SizeGroupAggregator {

    private val predefinedGroups =
        listOf(
            PredefinedSizeGroup("XXXS", 0, "3XS"),
            PredefinedSizeGroup("XXS", 1, "2XS"),
            PredefinedSizeGroup("XS", 2),
            PredefinedSizeGroup("S", 3),
            PredefinedSizeGroup("M", 4),
            PredefinedSizeGroup("L", 5),
            PredefinedSizeGroup("XL", 6),
            PredefinedSizeGroup("XXL", 7, "2XL"),
            PredefinedSizeGroup("XXXL", 8, "3XL"),
            PredefinedSizeGroup("XXXXL", 9, "4XL"),
        )

    fun group(sizes: List<String>): List<SizeGroupSummary> {
        return sizes
            .groupBy { determineGroup(it) }
            .mapValues { countValues(it.value) }
            .mapValues { sortSizeSummaries(it.value) }
            .map { SizeGroupSummary(it.key, it.value) }
            .sortedWith { summary1, summary2 -> sortGroupKeys(summary1.name, summary2.name) }
    }

    private fun sortGroupKeys(name: String, name2: String): Int {
        val firstOrder = predefinedGroups.find { it.name == name }?.order
        val secondOrder = predefinedGroups.find { it.name == name2 }?.order

        if (firstOrder != null || secondOrder != null) {
            return (firstOrder ?: Integer.MAX_VALUE).compareTo((secondOrder ?: Integer.MAX_VALUE))
        }

        return name.compareTo(name2)
    }

    private fun sortSizeSummaries(value: List<SizeSummary>): List<SizeSummary> {
        return value.sortedBy { it.size }
    }

    private fun countValues(value: List<String>): List<SizeSummary> {
        return value
            .groupBy { it }
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

    private class PredefinedSizeGroup(val name: String, val order: Int, val alias: String? = null) {
        fun isNameOrAlias(value: String): Boolean {
            val matchesName = value.startsWith(name, true)
            val matchesAlias = alias != null && value.startsWith(alias, true)

            return matchesName || matchesAlias
        }
    }
}

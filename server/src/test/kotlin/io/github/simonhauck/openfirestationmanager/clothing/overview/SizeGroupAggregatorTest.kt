package io.github.simonhauck.openfirestationmanager.clothing.overview

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

internal class SizeGroupAggregatorTest {

    private val sut = SizeGroupAggregator()

    @Test
    fun `should group sizes in ascending order by size`() {
        val expectedSizes =
            listOf(
                SizeGroupSummary(
                    "S",
                    listOf(
                        SizeSummary("S", 2),
                        SizeSummary("S-0", 3),
                        SizeSummary("S-1", 4),
                        SizeSummary("S-3", 5),
                    ),
                ),
                SizeGroupSummary(
                    "M",
                    listOf(
                        SizeSummary("M", 6),
                        SizeSummary("M SOGR-7cm Arm", 11),
                        SizeSummary("M-1", 7),
                        SizeSummary("M-2", 8),
                        SizeSummary("M-3", 9),
                        SizeSummary("M-4", 10),
                    ),
                ),
                SizeGroupSummary(
                    "L",
                    listOf(
                        SizeSummary("L", 12),
                        SizeSummary("L-0", 13),
                        SizeSummary("L-1", 14),
                        SizeSummary("L-2", 15),
                        SizeSummary("L-3", 16),
                    ),
                ),
                SizeGroupSummary(
                    "XL",
                    listOf(
                        SizeSummary("XL-0", 17),
                        SizeSummary("XL-1", 18),
                        SizeSummary("XL-2", 19),
                        SizeSummary("XL-3", 20),
                        SizeSummary("XL-4", 21),
                    ),
                ),
                SizeGroupSummary(
                    "XXL",
                    listOf(
                        SizeSummary("2XL-0", 22),
                        SizeSummary("2XL-1", 23),
                        SizeSummary("2XL-2", 24),
                        SizeSummary("2XL-3", 25),
                    ),
                ),
                SizeGroupSummary(
                    "XXXL",
                    listOf(
                        SizeSummary("3XL", 29),
                        SizeSummary("3XL-0", 26),
                        SizeSummary("3XL-1", 27),
                        SizeSummary("3XL-2", 28),
                    ),
                ),
                SizeGroupSummary("Sonstige", listOf(SizeSummary("35T", 30))),
            )

        val rawSizes =
            expectedSizes
                .flatMap { it.sizes }
                .flatMap { (size, amount) -> (1..amount).map { size } }
                .shuffled()

        val actual = sut.group(rawSizes)

        assertThat(actual).isEqualTo(expectedSizes)
    }
}

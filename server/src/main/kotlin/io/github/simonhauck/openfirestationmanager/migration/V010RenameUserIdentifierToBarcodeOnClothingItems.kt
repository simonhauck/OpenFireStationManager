package io.github.simonhauck.openfirestationmanager.migration

import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Component

@Component
class V010RenameUserIdentifierToBarcodeOnClothingItems : DatabaseMigration {
    override val id = "V010__rename_user_identifier_to_barcode_on_clothing_items"

    override fun execute(jdbcTemplate: JdbcTemplate) {
        jdbcTemplate.execute(
            """
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1
                    FROM information_schema.columns
                    WHERE table_schema = 'public'
                      AND table_name = 'clothing_items'
                      AND column_name = 'user_identifier'
                )
                AND NOT EXISTS (
                    SELECT 1
                    FROM information_schema.columns
                    WHERE table_schema = 'public'
                      AND table_name = 'clothing_items'
                      AND column_name = 'barcode'
                ) THEN
                    ALTER TABLE clothing_items RENAME COLUMN user_identifier TO barcode;
                END IF;
            END $$;
            """
                .trimIndent()
        )

        jdbcTemplate.execute(
            """
            ALTER INDEX IF EXISTS clothing_items_user_identifier_unique
            RENAME TO clothing_items_barcode_unique
            """
                .trimIndent()
        )

        jdbcTemplate.execute(
            """
            CREATE UNIQUE INDEX IF NOT EXISTS clothing_items_barcode_unique
            ON clothing_items (barcode)
            WHERE barcode IS NOT NULL
            """
                .trimIndent()
        )
    }
}


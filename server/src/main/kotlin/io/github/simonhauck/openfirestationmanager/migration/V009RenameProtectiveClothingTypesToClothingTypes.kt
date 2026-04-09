package io.github.simonhauck.openfirestationmanager.migration

import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Component

@Component
class V009RenameProtectiveClothingTypesToClothingTypes : DatabaseMigration {
    override val id = "V009__rename_protective_clothing_types_to_clothing_types"

    override fun execute(jdbcTemplate: JdbcTemplate) {
        jdbcTemplate.execute(
            """
            DO $$
            BEGIN
                IF to_regclass('public.clothing_types') IS NOT NULL
                    AND to_regclass('public.protective_clothing_types') IS NOT NULL THEN
                    RAISE EXCEPTION 'Both clothing_types and protective_clothing_types exist; check for table conflicts and merge or drop one table before re-running migration V009.';
                ELSIF to_regclass('public.clothing_types') IS NOT NULL THEN
                    RAISE NOTICE 'Table clothing_types already exists; skipping rename in V009.';
                ELSIF to_regclass('public.clothing_types') IS NULL
                    AND to_regclass('public.protective_clothing_types') IS NOT NULL THEN
                    ALTER TABLE protective_clothing_types RENAME TO clothing_types;
                END IF;
            END $$;
            """
                .trimIndent()
        )
    }
}

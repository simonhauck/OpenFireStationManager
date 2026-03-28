package io.github.simonhauck.openfirestationmanager.db

import io.github.simonhauck.openfirestationmanager.security.auth.CurrentUserProvider
import java.time.ZonedDateTime
import org.springframework.data.relational.core.conversion.MutableAggregateChange
import org.springframework.data.relational.core.mapping.event.BeforeSaveCallback
import org.springframework.stereotype.Component

@Component
class EntitySaveListener(private val currentUserProvider: CurrentUserProvider) :
    BeforeSaveCallback<BaseEntity> {

    override fun onBeforeSave(
        aggregate: BaseEntity,
        aggregateChange: MutableAggregateChange<BaseEntity>,
    ): BaseEntity {
        val now = ZonedDateTime.now()
        val currentUser = currentUserProvider.getCurrentUser() ?: "System"

        return aggregate.copyWithMetaData(
            EntityMetaData(
                createdAt = if (aggregate.id == 0L) now else aggregate.metaData.createdAt,
                createdBy = if (aggregate.id == 0L) currentUser else aggregate.metaData.createdBy,
                lastModifiedAt = now,
                lastModifiedBy = currentUser,
            )
        )
    }
}

package io.github.simonhauck.openfirestationmanager.usermanagement

import org.springframework.data.repository.Repository

interface UserRepository : Repository<UserAccount, Long> {

    fun save(user: UserAccount): UserAccount

    fun findAll(): List<UserAccount>

    fun findById(id: Long): UserAccount?

    fun findByUsername(username: String): UserAccount?

    fun existsByUsername(username: String): Boolean

    fun count(): Long

    fun deleteAll()
}

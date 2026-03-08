package io.github.simonhauck.openfirestationmanager.user

import org.springframework.data.repository.Repository

interface UserRepository : Repository<UserAccount, Long> {

  fun save(user: UserAccount): UserAccount

  fun findByUsername(username: String): UserAccount?

  fun existsByUsername(username: String): Boolean

  fun count(): Long
}

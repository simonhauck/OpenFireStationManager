package io.github.simonhauck.openfirestationmanager.member

import org.springframework.data.jdbc.repository.query.Query
import org.springframework.data.repository.Repository

interface MemberRepository : Repository<Member, Long> {

    fun save(member: Member): Member

    @Query("SELECT * FROM members ORDER BY id") fun findAll(): List<Member>

    fun findById(id: Long): Member?

    fun deleteById(id: Long)
}

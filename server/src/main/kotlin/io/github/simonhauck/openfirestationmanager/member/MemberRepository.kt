package io.github.simonhauck.openfirestationmanager.member

import org.springframework.data.repository.Repository

interface MemberRepository : Repository<Member, Long> {

    fun save(member: Member): Member

    fun findAll(): List<Member>

    fun findById(id: Long): Member?

    fun deleteById(id: Long)
}

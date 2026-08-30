package io.github.simonhauck.openfirestationmanager.member

import io.github.simonhauck.openfirestationmanager.common.NotFoundException
import org.springframework.stereotype.Service

@Service
class MemberService(private val repository: MemberRepository) {

    fun getAllMembers(): List<Member> = repository.findAll()

    fun getMemberById(id: Long): Member = findOrThrow(id)

    fun createMember(request: CreateOrUpdateMemberRequest): Member {
        return repository.save(Member(name = request.name))
    }

    fun updateMember(id: Long, request: CreateOrUpdateMemberRequest): Member {
        return repository.save(findOrThrow(id).copy(name = request.name))
    }

    fun deleteMember(id: Long) {
        findOrThrow(id)
        repository.deleteById(id)
    }

    private fun findOrThrow(id: Long): Member {
        return repository.findById(id) ?: throw NotFoundException("Member not found for id: $id")
    }
}

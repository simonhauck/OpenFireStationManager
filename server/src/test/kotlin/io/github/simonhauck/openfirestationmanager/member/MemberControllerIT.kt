package io.github.simonhauck.openfirestationmanager.member

import io.github.simonhauck.openfirestationmanager.IntegrationTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.HttpStatus

class MemberControllerIT : IntegrationTest() {

    @Autowired private lateinit var calls: MemberControllerCalls

    @Test
    fun `createMember should create a new member`() {
        val name = "Member-${System.nanoTime()}"

        val response =
            calls.createMember(CreateOrUpdateMemberRequest(name), authCookie = validCookieHeader)

        assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
        assertThat(response.body?.id).isGreaterThan(0)
        assertThat(response.body?.name).isEqualTo(name)
    }

    @Test
    fun `getMemberById should return an existing member`() {
        val name = "Member-${System.nanoTime()}"
        val created =
            calls
                .createMember(CreateOrUpdateMemberRequest(name), authCookie = validCookieHeader)
                .body!!

        val response = calls.getMemberById(created.id, authCookie = validCookieHeader)

        assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
        assertThat(response.body?.id).isEqualTo(created.id)
        assertThat(response.body?.name).isEqualTo(name)
    }

    @Test
    fun `getAllMembers should include created members`() {
        val name = "Member-${System.nanoTime()}"
        val created =
            calls
                .createMember(CreateOrUpdateMemberRequest(name), authCookie = validCookieHeader)
                .body!!

        val response = calls.getAllMembers(authCookie = validCookieHeader)

        assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
        assertThat(response.body?.map { it.id }).contains(created.id)
    }

    @Test
    fun `updateMember should update an existing member`() {
        val created =
            calls
                .createMember(
                    CreateOrUpdateMemberRequest("Member-${System.nanoTime()}"),
                    authCookie = validCookieHeader,
                )
                .body!!
        val updatedName = "UpdatedMember-${System.nanoTime()}"

        val response =
            calls.updateMember(
                created.id,
                CreateOrUpdateMemberRequest(updatedName),
                authCookie = validCookieHeader,
            )

        assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
        assertThat(response.body?.id).isEqualTo(created.id)
        assertThat(response.body?.name).isEqualTo(updatedName)
    }

    @Test
    fun `deleteMember should delete an existing member`() {
        val created =
            calls
                .createMember(
                    CreateOrUpdateMemberRequest("Member-${System.nanoTime()}"),
                    authCookie = validCookieHeader,
                )
                .body!!

        val response = calls.deleteMember(created.id, authCookie = validCookieHeader)

        assertThat(response.statusCode).isEqualTo(HttpStatus.NO_CONTENT)
    }
}

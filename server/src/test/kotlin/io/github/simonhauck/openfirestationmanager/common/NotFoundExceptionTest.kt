package io.github.simonhauck.openfirestationmanager.common

import kotlin.test.Test
import org.assertj.core.api.Assertions.assertThat
import org.springframework.http.HttpStatus

class NotFoundExceptionTest {

    @Test
    fun `should use not found status and default message`() {
        val exception = NotFoundException()

        assertThat(exception.statusCode).isEqualTo(HttpStatus.NOT_FOUND)
        assertThat(exception.publicMessage).isEqualTo("Resource not found")
    }

    @Test
    fun `should allow overriding the default message`() {
        val exception = NotFoundException("User not found for id: 42")

        assertThat(exception.statusCode).isEqualTo(HttpStatus.NOT_FOUND)
        assertThat(exception.publicMessage).isEqualTo("User not found for id: 42")
    }
}

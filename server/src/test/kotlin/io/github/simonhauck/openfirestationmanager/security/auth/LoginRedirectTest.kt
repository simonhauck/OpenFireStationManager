package io.github.simonhauck.openfirestationmanager.security.auth

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

class LoginRedirectTest {

    @Test
    fun `keeps relative paths including query and fragment`() {
        assertThat(LoginRedirect.sanitize("/pool-clothing/return?returnTarget=POOL#top"))
            .isEqualTo("/pool-clothing/return?returnTarget=POOL#top")
    }

    @Test
    fun `falls back to the dashboard for open redirect attempts`() {
        val attempts =
            listOf(
                null,
                "",
                "//evil.example",
                "//evil.example/dashboard",
                "/\\evil.example",
                "https://evil.example",
                "evil.example",
                "javascript:alert(1)",
                "/\tevil",
            )

        assertThat(attempts.map(LoginRedirect::sanitize)).allMatch { it == "/dashboard" }
    }
}

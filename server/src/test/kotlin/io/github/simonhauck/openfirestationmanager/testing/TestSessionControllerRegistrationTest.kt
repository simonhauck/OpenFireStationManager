package io.github.simonhauck.openfirestationmanager.testing

import io.github.simonhauck.openfirestationmanager.security.auth.AuthProperties
import io.github.simonhauck.openfirestationmanager.security.auth.OfsmUserFactory
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.mockito.Mockito.mock
import org.springframework.boot.test.context.runner.ApplicationContextRunner
import org.springframework.security.web.context.SecurityContextRepository

class TestSessionControllerRegistrationTest {

    private val contextRunner =
        ApplicationContextRunner()
            .withBean(
                SecurityContextRepository::class.java,
                { mock(SecurityContextRepository::class.java) },
            )
            .withBean(OfsmUserFactory::class.java, { OfsmUserFactory(AuthProperties()) })
            .withUserConfiguration(TestSessionController::class.java)

    @Test
    fun `is registered when app testing is enabled`() {
        contextRunner.withPropertyValues("app.testing.enabled=true").run { context ->
            assertThat(context).hasSingleBean(TestSessionController::class.java)
        }
    }

    @Test
    fun `is absent when app testing is not enabled`() {
        contextRunner.run { context ->
            assertThat(context).doesNotHaveBean(TestSessionController::class.java)
        }
    }
}

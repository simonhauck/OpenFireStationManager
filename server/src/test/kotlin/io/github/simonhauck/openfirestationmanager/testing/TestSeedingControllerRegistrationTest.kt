package io.github.simonhauck.openfirestationmanager.testing

import io.github.simonhauck.openfirestationmanager.clothing.type.ClothingTypeService
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.mockito.Mockito.mock
import org.springframework.boot.test.context.runner.ApplicationContextRunner

class TestSeedingControllerRegistrationTest {

    private val contextRunner =
        ApplicationContextRunner()
            .withBean(ClothingTypeService::class.java, { mock(ClothingTypeService::class.java) })
            .withUserConfiguration(TestSeedingController::class.java)

    @Test
    fun `is registered when app testing is enabled`() {
        contextRunner.withPropertyValues("app.testing.enabled=true").run { context ->
            assertThat(context).hasSingleBean(TestSeedingController::class.java)
        }
    }

    @Test
    fun `is absent when app testing is not enabled`() {
        contextRunner.run { context ->
            assertThat(context).doesNotHaveBean(TestSeedingController::class.java)
        }
    }
}

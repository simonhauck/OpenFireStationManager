package io.github.simonhauck.openfirestationmanager.releasecomposepinning

import org.gradle.api.Plugin
import org.gradle.api.Project

class ReleaseComposePinningPlugin : Plugin<Project> {
    override fun apply(project: Project) {
        val extension =
            project.extensions.create(
                "releaseComposePinning",
                ReleaseComposePinningExtension::class.java,
            )
        extension.versionPropertyFilePath.convention("gradle.properties")
        extension.composeFilePath.convention("infrastructure/ofsm-prod/compose.yml")
        extension.imageName.convention("ghcr.io/simonhauck/open-fire-station-manager")

        val updateTaskProvider =
            project.tasks.register(
                "updateProdComposeImage",
                UpdateComposeImageTagTask::class.java,
            ) {
                it.versionPropertyFile.set(
                    project.layout.projectDirectory.file(extension.versionPropertyFilePath)
                )
                it.composeFile.set(project.layout.projectDirectory.file(extension.composeFilePath))
                it.imageName.set(extension.imageName)
            }

        project.pluginManager.withPlugin("io.github.simonhauck.release") {
            updateTaskProvider.configure {
                it.dependsOn(project.tasks.named("writeReleaseVersion"))
            }
            project.tasks.named("commitReleaseVersion").configure {
                it.dependsOn(updateTaskProvider)
            }
        }
    }
}

package io.github.simonhauck.openfirestationmanager.releasecomposepinning

import org.gradle.api.Plugin
import org.gradle.api.Project

class ReleaseComposePinningPlugin : Plugin<Project> {
    override fun apply(project: Project) {
        val updateTaskProvider =
            project.tasks.register(
                "updateProdComposeImage",
                UpdateComposeImageTagTask::class.java,
            ) {
                it.versionPropertyFile.set(
                    project.layout.projectDirectory.file("gradle.properties")
                )
                it.composeFile.set(
                    project.layout.projectDirectory.file("infrastructure/ofsm-prod/compose.yml")
                )
                it.imageName.set("ghcr.io/simonhauck/open-fire-station-manager")
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

package io.github.simonhauck.openfirestationmanager.frontendroutemapping

import org.gradle.api.Plugin
import org.gradle.api.Project
import org.gradle.api.tasks.SourceSetContainer

class FrontendRouteMappingPlugin : Plugin<Project> {
    override fun apply(project: Project) {
        val extension =
            project.extensions.create(
                "frontendRouteMapping",
                FrontendRouteMappingExtension::class.java,
            )

        extension.generatedPackage.convention(
            "io.github.simonhauck.openfirestationmanager.ui.generated"
        )
        extension.generatedControllerClassName.convention("GeneratedUiController")

        val taskProvider =
            project.tasks.register(
                "generateFrontendRouteMapping",
                GenerateFrontendRouteMappingTask::class.java,
            ) { task ->
                task.routeTreeFile.set(extension.routeTreeFile)
                task.generatedPackage.set(extension.generatedPackage)
                task.generatedControllerClassName.set(extension.generatedControllerClassName)
                task.outputDirectory.set(
                    project.layout.buildDirectory.dir(
                        "generated/sources/frontendRouteMapping/kotlin"
                    )
                )
            }

        project.plugins.withId("java") {
            val sourceSets = project.extensions.getByType(SourceSetContainer::class.java)
            sourceSets.named("main").configure {
                it.java.srcDir(taskProvider.map { task -> task.outputDirectory })
            }
        }

        project.tasks
            .matching { it.name == "compileKotlin" }
            .configureEach { it.dependsOn(taskProvider) }
    }
}

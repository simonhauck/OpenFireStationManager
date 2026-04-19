package io.github.simonhauck.openfirestationmanager.frontendroutemapping

import com.squareup.kotlinpoet.AnnotationSpec
import com.squareup.kotlinpoet.ClassName
import com.squareup.kotlinpoet.FileSpec
import com.squareup.kotlinpoet.FunSpec
import com.squareup.kotlinpoet.TypeSpec
import javax.inject.Inject
import org.gradle.api.DefaultTask
import org.gradle.api.file.DirectoryProperty
import org.gradle.api.file.FileSystemOperations
import org.gradle.api.file.RegularFileProperty
import org.gradle.api.provider.Property
import org.gradle.api.tasks.CacheableTask
import org.gradle.api.tasks.Input
import org.gradle.api.tasks.InputFile
import org.gradle.api.tasks.Optional
import org.gradle.api.tasks.OutputDirectory
import org.gradle.api.tasks.PathSensitive
import org.gradle.api.tasks.PathSensitivity
import org.gradle.api.tasks.TaskAction

@CacheableTask
abstract class GenerateFrontendRouteMappingTask : DefaultTask() {
    @get:Inject abstract val fileSystemOperations: FileSystemOperations

    @get:Optional
    @get:InputFile
    @get:PathSensitive(PathSensitivity.RELATIVE)
    abstract val routeTreeFile: RegularFileProperty

    @get:Input abstract val generatedPackage: Property<String>

    @get:Input abstract val generatedControllerClassName: Property<String>

    @get:OutputDirectory abstract val outputDirectory: DirectoryProperty

    @TaskAction
    fun generate() {
        clearOutputDirectory()

        val routeTree = routeTreeFile.orNull?.asFile
        val routes =
            if (routeTree != null && routeTree.exists()) {
                RouteTreeParser.parseRoutes(routeTree.readText())
            } else {
                emptyList()
            }

        generateKotlinFiles(routes)
    }

    private fun clearOutputDirectory() {
        fileSystemOperations.delete { spec -> spec.delete(outputDirectory) }
    }

    private fun generateKotlinFiles(routes: List<String>) {
        val packageName = generatedPackage.get()
        val controllerClassName = generatedControllerClassName.get()
        val outputDir = outputDirectory.get().asFile

        val mappings = routes.filter { it.isNotBlank() }.distinct().sorted()

        val controllerBuilder =
            TypeSpec.classBuilder(controllerClassName)
                .addAnnotation(ClassName("org.springframework.stereotype", "Controller"))

        if (mappings.isNotEmpty()) {
            controllerBuilder.addFunction(
                FunSpec.builder("forwardToIndex")
                    .addAnnotation(
                        AnnotationSpec.builder(
                                ClassName(
                                    "org.springframework.web.bind.annotation",
                                    "RequestMapping",
                                )
                            )
                            .addMember(
                                "value = [\n%L\n]",
                                mappings.joinToString(",\n") { "\"$it\"" },
                            )
                            .build()
                    )
                    .returns(String::class)
                    .addStatement("return %S", "forward:/index.html")
                    .build()
            )
        }

        val controllerSpec = controllerBuilder.build()

        FileSpec.builder(packageName, controllerClassName)
            .addType(controllerSpec)
            .build()
            .writeTo(outputDir)
    }
}

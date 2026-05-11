package io.github.simonhauck.openfirestationmanager.releasecomposepinning

import java.util.Properties
import org.gradle.api.DefaultTask
import org.gradle.api.file.RegularFileProperty
import org.gradle.api.provider.Property
import org.gradle.api.tasks.Input
import org.gradle.api.tasks.InputFile
import org.gradle.api.tasks.PathSensitive
import org.gradle.api.tasks.PathSensitivity
import org.gradle.api.tasks.TaskAction
import org.gradle.work.DisableCachingByDefault

@DisableCachingByDefault(because = "Task rewrites the input compose file in place.")
abstract class UpdateComposeImageTagTask : DefaultTask() {
    @get:InputFile
    @get:PathSensitive(PathSensitivity.RELATIVE)
    abstract val versionPropertyFile: RegularFileProperty

    @get:InputFile
    @get:PathSensitive(PathSensitivity.RELATIVE)
    abstract val composeFile: RegularFileProperty

    @get:Input abstract val imageName: Property<String>

    @TaskAction
    fun updateImageTag() {
        val version = loadVersion()
        val compose = composeFile.get().asFile
        val image = imageName.get()
        val currentContent = compose.readText()
        val updated =
            currentContent.replace(Regex("${Regex.escape(image)}:[^\\s]+"), "$image:$version")

        if (updated != currentContent) {
            compose.writeText(updated)
        }
    }

    private fun loadVersion(): String {
        val properties = Properties()
        versionPropertyFile.get().asFile.inputStream().use(properties::load)
        return requireNotNull(properties.getProperty("version")) {
            "Missing 'version' property in ${versionPropertyFile.get().asFile.path}"
        }
    }
}

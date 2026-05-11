package io.github.simonhauck.openfirestationmanager.releasecomposepinning

import javax.inject.Inject
import org.gradle.api.model.ObjectFactory
import org.gradle.api.provider.Property

abstract class ReleaseComposePinningExtension @Inject constructor(objects: ObjectFactory) {
    val versionPropertyFilePath: Property<String> = objects.property(String::class.java)
    val composeFilePath: Property<String> = objects.property(String::class.java)
    val imageName: Property<String> = objects.property(String::class.java)
}

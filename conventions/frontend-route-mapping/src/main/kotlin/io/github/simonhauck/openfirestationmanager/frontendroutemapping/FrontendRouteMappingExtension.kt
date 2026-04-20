package io.github.simonhauck.openfirestationmanager.frontendroutemapping

import org.gradle.api.file.RegularFileProperty
import org.gradle.api.provider.Property

abstract class FrontendRouteMappingExtension {
    abstract val routeTreeFile: RegularFileProperty
    abstract val generatedPackage: Property<String>
    abstract val generatedControllerClassName: Property<String>
}

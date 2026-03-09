package io.github.simonhauck.openfirestationmanager.testutil

import java.io.File
import kotlin.reflect.KClass
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.RecursiveComparisonAssert
import tools.jackson.databind.json.JsonMapper
import tools.jackson.module.kotlin.KotlinModule

fun snapshotTest(testClass: Any, fn: SnapshotTestDriver.() -> Unit) {
    val resourceLoader = ResourceLoader(testClass.javaClass)
    fn(SnapshotTestDriver(resourceLoader))
}

class SnapshotTestDriver(val resourceLoader: ResourceLoader) {

    private val objectMapper: JsonMapper

    init {
        val builder = JsonMapper.builder()
        builder.addModule(KotlinModule.Builder().build())
        objectMapper = builder.build()
    }

    fun <T> T?.shouldEqualSnapshot(
        fileName: String,
        modifier: (RecursiveComparisonAssert<*>) -> RecursiveComparisonAssert<*> = { it },
    ) {
        runCatching {
                require(this != null) { "Can not use snapshot test if value is null" }

                val expected = resourceLoader.readAnyObject(fileName, this::class.java)

                val usingRecursiveComparison = assertThat(this).usingRecursiveComparison()
                modifier(usingRecursiveComparison).isEqualTo(expected)
            }
            .recover { printErrorOrUpdateSnapshot(this, fileName, it) }
    }

    fun <T : Any> List<T>?.shouldEqualSnapshots(vararg fileName: String) {
        assertThat(this?.size).isEqualTo(fileName.size)
        this?.forEachIndexed { index, item -> item.shouldEqualSnapshot(fileName[index]) }
    }

    fun <T : Any> List<T>?.shouldEqualSnapshotList(
        fileName: String,
        clazz: KClass<T>,
        modifier: (RecursiveComparisonAssert<*>) -> RecursiveComparisonAssert<*> = { it },
    ) {
        require(this != null) { "Can not use snapshot test if value is null" }

        runCatching {
                val expected = resourceLoader.readObjectList(fileName, clazz.java)

                val usingRecursiveComparison = assertThat(this).usingRecursiveComparison()
                modifier(usingRecursiveComparison).isEqualTo(expected)
            }
            .recover { printErrorOrUpdateSnapshot(this, fileName, it) }
    }

    private fun printErrorOrUpdateSnapshot(actual: Any?, fileName: String, t: Throwable) {
        if (checkAndApplySourceUpdate(actual, fileName)) return
        t.printStackTrace()

        val expectedAsString = resourceLoader.readJson(fileName)
        // Re-throw the original exception to preserve the recursive comparison details

        println("Actual value for easy copy pasting")
        println(objectMapper.writeValueAsString(actual))
        println("Expected value from snapshot file: $fileName")
        println(expectedAsString)

        throw t
    }

    private fun checkAndApplySourceUpdate(actual: Any?, fileName: String): Boolean {
        val shouldUpdate = System.getenv("UPDATE_SNAPSHOT") == "true"
        if (!shouldUpdate) return false

        val prettyPrintedString =
            objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(actual)

        val classLoaderFile = resourceLoader.getOrCreateResourceFile(fileName)

        // This Regex is necessary to handle different test source sets like 'test' and
        // 'integrationTest'
        val originalFile =
            File(
                classLoaderFile.path
                    .replace("\\", "/")
                    .replace(Regex("build/resources/([^/]+)"), "src/$1/resources")
            )

        originalFile.parentFile.mkdirs()

        originalFile.writeText(prettyPrintedString)
        println("Updated snapshot file: $originalFile")
        return true
    }
}

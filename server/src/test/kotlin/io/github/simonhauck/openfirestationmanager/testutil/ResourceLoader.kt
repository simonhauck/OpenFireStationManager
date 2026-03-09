package io.github.simonhauck.openfirestationmanager.testutil

import java.io.File
import java.io.FileNotFoundException
import java.nio.charset.StandardCharsets
import kotlin.collections.joinToString
import kotlin.collections.map
import kotlin.collections.toString
import kotlin.io.readBytes
import kotlin.io.readText
import kotlin.jvm.javaClass
import kotlin.text.lines
import kotlin.text.replace
import kotlin.text.trim
import org.assertj.core.util.Files
import tools.jackson.databind.json.JsonMapper
import tools.jackson.module.kotlin.KotlinModule

class ResourceLoader(private val javaClazz: Class<*>) {

    private val objectMapper: JsonMapper

    init {
        val builder = JsonMapper.builder()
        builder.addModule(KotlinModule.Builder().build())
        objectMapper = builder.build()
    }

    fun getFile(fileName: String): File {
        val filePath =
            javaClazz.getResource(fileName)?.file
                ?: throw FileNotFoundException("File with resource $fileName not found.")
        return File(filePath)
    }

    fun getOrCreateResourceFile(fileName: String): File {
        val filePath = javaClazz.getResource(fileName)?.file

        if (filePath != null) {
            return File(filePath)
        }

        val codeSource = javaClazz.protectionDomain.codeSource.location.path

        val sourceSet =
            when {
                codeSource.contains("integrationTest") -> "integrationTest"
                else -> "test"
            }

        val prefix = "build/resources/$sourceSet"
        val packageName = javaClazz.packageName.replace(".", "/")
        val file = File("$prefix/$packageName/$fileName")

        file.parentFile.mkdirs()

        return file
    }

    fun readJson(fileName: String): String {
        val file = getFile(fileName)
        return Files.linesOf(file, StandardCharsets.UTF_8)
            .map { it.trim() }
            .joinToString("") { it.replace(": ", ":") }
    }

    fun readAnyObject(fileName: String, clazz: Class<*>): Any {
        val fileContent = read(fileName)

        return objectMapper.readValue(fileContent, clazz)
    }

    fun <T> readObject(fileName: String, clazz: Class<T>): T {
        val fileContent = read(fileName)

        return objectMapper.readValue(fileContent, clazz)
    }

    fun <T> readObjectList(fileName: String, clazz: Class<T>): T {
        val fileContent = read(fileName)

        val typeReference =
            objectMapper.getTypeFactory().constructCollectionType(List::class.java, clazz)

        return objectMapper.readValue(fileContent, typeReference)
    }

    fun read(fileName: String): String {
        val file = getFile(fileName)
        return file.readBytes().toString(StandardCharsets.UTF_8)
    }

    fun readLines(fileName: String): List<String> = read(fileName).lines()

    fun readFromClassLoader(fileName: String): String {
        return this.javaClass.classLoader
            .getResource(fileName)
            ?.readText(StandardCharsets.UTF_8)
            ?.lines()
            ?.joinToString(System.lineSeparator())
            ?: throw kotlin.NullPointerException("Failed to resolve resource $fileName")
    }

    fun readBytes(fileName: String): ByteArray {
        val file = getFile(fileName)
        return file.readBytes()
    }
}

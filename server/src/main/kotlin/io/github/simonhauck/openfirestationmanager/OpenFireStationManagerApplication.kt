package io.github.simonhauck.openfirestationmanager

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication

@SpringBootApplication class OpenFireStationManagerApplication

fun main(args: Array<String>) {
    runApplication<OpenFireStationManagerApplication>(*args)
}

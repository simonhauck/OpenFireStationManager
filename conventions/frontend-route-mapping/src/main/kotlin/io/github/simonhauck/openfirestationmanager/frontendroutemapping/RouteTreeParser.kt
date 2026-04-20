package io.github.simonhauck.openfirestationmanager.frontendroutemapping

internal object RouteTreeParser {
    private val routeUnionRegex = Regex("""\bto:\s*\n((?:\s*\|\s*'[^']+'\s*\n)+)""")
    private val routeValueRegex = Regex("""'([^']+)'""")

    fun parseRoutes(content: String): List<String> {
        val toUnion = routeUnionRegex.find(content)?.groupValues?.get(1) ?: return emptyList()
        val routes = routeValueRegex.findAll(toUnion).map { it.groupValues[1] }

        return routes
            .filter { it.startsWith("/") }
            .map(::toSpringPath)
            .filter { it.isNotBlank() }
            .distinct()
            .sorted()
            .toList()
    }

    private fun toSpringPath(route: String): String {
        val normalized = route.trim()
        if (normalized == "/") {
            return "/"
        }

        val trimmed = normalized.trimEnd('/')
        if (trimmed.isBlank()) {
            return ""
        }

        val springPath =
            trimmed.removePrefix("/").split('/').joinToString(separator = "/") { segment ->
                if (segment.startsWith("$")) {
                    "*"
                } else {
                    segment
                }
            }

        return "/$springPath"
    }
}

package io.github.simonhauck.openfirestationmanager.security.auth

/**
 * The return path a browser is sent to after a successful login. Only same-origin relative paths
 * are accepted, so the login entry point cannot be abused as an open redirect.
 */
object LoginRedirect {
    /** Session attribute holding the validated return path between entry point and callback. */
    const val SESSION_ATTRIBUTE = "OFSM_LOGIN_REDIRECT"

    const val FALLBACK = "/dashboard"

    /**
     * Returns [target] when it is a relative path (starts with `/`, not `//`, no backslash or
     * control character), and [FALLBACK] otherwise.
     */
    fun sanitize(target: String?): String {
        if (target.isNullOrEmpty()) return FALLBACK
        if (!target.startsWith("/") || target.startsWith("//")) return FALLBACK
        if (target.any { it == '\\' || it.isISOControl() || it.isWhitespace() }) return FALLBACK
        return target
    }
}

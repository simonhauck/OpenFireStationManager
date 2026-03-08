package io.github.simonhauck.openfirestationmanager.security.config

import io.github.simonhauck.openfirestationmanager.security.auth.AuthService
import io.github.simonhauck.openfirestationmanager.security.shared.JwtTokenUtility
import io.github.simonhauck.openfirestationmanager.security.shared.ParseTokenResult
import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter

@Component
class TokenCookieFilter(
    private val authService: AuthService,
    private val appSecProperties: AuthenticationProperties,
    private val jwtTokenUtility: JwtTokenUtility,
) : OncePerRequestFilter() {

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain,
    ) {

        val token = request.cookies.find { it.name == appSecProperties.cookieName }?.value

        if (token == null) {
            filterChain.doFilter(request, response)
            return
        }

        val tokenResult = jwtTokenUtility.parseToken(token)

        val user =
            when (tokenResult) {
                is ParseTokenResult.Failure -> null
                is ParseTokenResult.Success ->
                    UsernamePasswordAuthenticationToken(
                        tokenResult.userName,
                        null,
                        tokenResult.roles.map { SimpleGrantedAuthority("ROLE_$it") },
                    )
            }

        if (user != null) {
            SecurityContextHolder.getContext().authentication = user
        }

        filterChain.doFilter(request, response)
    }
}

package io.github.simonhauck.openfirestationmanager.security.auth

import io.github.simonhauck.openfirestationmanager.usermanagement.UserRepository
import io.github.simonhauck.openfirestationmanager.usermanagement.UserRole
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.core.userdetails.User
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.security.core.userdetails.UserDetailsService
import org.springframework.security.core.userdetails.UsernameNotFoundException
import org.springframework.stereotype.Service

@Service
class UserDetailsServiceImpl(private val userRepository: UserRepository) : UserDetailsService {
    override fun loadUserByUsername(username: String): UserDetails {
        val user =
            userRepository.findByUsername(username)
                ?: throw UsernameNotFoundException("No user found for username: $username")

        val userRoles = if (user.roles.contains(UserRole.ADMIN)) UserRole.entries else user.roles
        val grantedRoles = userRoles.map { role -> SimpleGrantedAuthority("ROLE_${role.name}") }

        return User.withUsername(user.username)
            .password(user.passwordHash)
            .authorities(grantedRoles)
            .disabled(!user.enabled)
            .build()
    }
}

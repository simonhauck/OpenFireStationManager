package io.github.simonhauck.openfirestationmanager.security

import io.github.simonhauck.openfirestationmanager.user.UserRepository
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.core.userdetails.User
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.security.core.userdetails.UserDetailsService
import org.springframework.security.core.userdetails.UsernameNotFoundException
import org.springframework.stereotype.Service

@Service
class UserDetailsServiceImpl(
    private val userRepository: UserRepository,
) : UserDetailsService {
    override fun loadUserByUsername(username: String): UserDetails {
        val user = userRepository.findByUsername(username)
            ?: throw UsernameNotFoundException("No user found for username: $username")

        return User.withUsername(user.username)
            .password(user.passwordHash)
            .authorities(user.roles.map { role -> SimpleGrantedAuthority("ROLE_${role.name}") })
            .disabled(!user.enabled)
            .build()
    }
}

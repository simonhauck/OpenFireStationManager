package io.github.simonhauck.openfirestationmanager.security.auth

import io.github.simonhauck.openfirestationmanager.usermanagement.UserAccount

data class AuthStateResponse(val authenticated: Boolean, val user: UserAccount?)

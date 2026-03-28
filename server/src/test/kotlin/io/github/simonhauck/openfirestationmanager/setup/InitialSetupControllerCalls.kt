package io.github.simonhauck.openfirestationmanager.setup

import io.github.simonhauck.openfirestationmanager.usermanagement.UserAccount
import org.springframework.boot.resttestclient.TestRestTemplate
import org.springframework.boot.resttestclient.postForEntity
import org.springframework.http.ProblemDetail
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Component

@Component
class InitialSetupControllerCalls(private val testRestTemplate: TestRestTemplate) {

    fun createInitialAdmin(request: InitialAdminSetupRequest): ResponseEntity<UserAccount> {
        return testRestTemplate.postForEntity<UserAccount>(
            "/api/public/setup/initial-admin",
            request,
        )
    }

    fun createInitialAdminExpectingProblem(
        request: InitialAdminSetupRequest
    ): ResponseEntity<ProblemDetail> {
        return testRestTemplate.postForEntity<ProblemDetail>(
            "/api/public/setup/initial-admin",
            request,
        )
    }
}

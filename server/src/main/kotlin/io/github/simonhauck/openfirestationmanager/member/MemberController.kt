package io.github.simonhauck.openfirestationmanager.member

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import jakarta.validation.Valid
import jakarta.validation.constraints.Positive
import org.springframework.http.HttpStatus
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/members")
@Validated
class MemberController(private val service: MemberService) {

    @GetMapping
    @Operation(summary = "List all members")
    fun getAllMembers(): List<Member> = service.getAllMembers()

    @GetMapping("/{id}")
    @Operation(summary = "Get a member by ID")
    fun getMemberById(
        @Parameter(description = "ID of the member") @PathVariable @Positive id: Long
    ): Member = service.getMemberById(id)

    @PostMapping
    @Operation(summary = "Create a new member")
    @PreAuthorize("hasRole('ROLE_KLEIDERWART')")
    fun createMember(@Valid @RequestBody request: CreateOrUpdateMemberRequest): Member =
        service.createMember(request)

    @PatchMapping("/{id}")
    @Operation(summary = "Update a member")
    @PreAuthorize("hasRole('ROLE_KLEIDERWART')")
    fun updateMember(
        @Parameter(description = "ID of the member") @PathVariable @Positive id: Long,
        @Valid @RequestBody request: CreateOrUpdateMemberRequest,
    ): Member = service.updateMember(id, request)

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ROLE_KLEIDERWART')")
    @Operation(summary = "Delete a member")
    fun deleteMember(
        @Parameter(description = "ID of the member") @PathVariable @Positive id: Long
    ) {
        service.deleteMember(id)
    }
}

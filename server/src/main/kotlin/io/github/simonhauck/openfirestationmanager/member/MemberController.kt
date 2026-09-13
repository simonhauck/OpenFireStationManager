package io.github.simonhauck.openfirestationmanager.member

import io.github.simonhauck.openfirestationmanager.common.ApiTags
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import io.swagger.v3.oas.annotations.media.Content
import io.swagger.v3.oas.annotations.media.Schema
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import jakarta.validation.constraints.Positive
import org.springframework.http.HttpStatus
import org.springframework.http.ProblemDetail
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
@Tag(name = ApiTags.MEMBERS)
class MemberController(private val service: MemberService) {

    @GetMapping
    @Operation(
        operationId = "listMembers",
        summary = "List every member",
        description =
            "Returns the whole roster of people in the brigade (*Mitglied*), in the order they " +
                "were added. The list is unpaginated.\n\n" +
                "A member is a **person**, not a login. User accounts are managed separately " +
                "under `/api/admin/users`, and the two are not linked — someone can be on the " +
                "roster without ever signing in. Use this endpoint when you need people; use " +
                "`listUsers` when you need credentials.",
    )
    @ApiResponses(ApiResponse(responseCode = "200", description = "Every member on the roster."))
    fun getAllMembers(): List<Member> = service.getAllMembers()

    @GetMapping("/{id}")
    @Operation(
        operationId = "getMember",
        summary = "Get one member by their numeric id",
        description = "Looks up a single person on the roster by their database id.",
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "The member."),
        ApiResponse(
            responseCode = "404",
            description = "No member exists with this id.",
            content =
                [
                    Content(
                        mediaType = "application/problem+json",
                        schema = Schema(implementation = ProblemDetail::class),
                    )
                ],
        ),
    )
    fun getMemberById(
        @Parameter(description = "Numeric id of the member.", example = "5")
        @PathVariable
        @Positive
        id: Long
    ): Member = service.getMemberById(id)

    @PostMapping
    @Operation(
        operationId = "createMember",
        summary = "Add a person to the roster",
        description =
            "Creates a new member. Names are not required to be unique, so check the existing " +
                "roster first if you want to avoid a duplicate entry for the same person.\n\n" +
                "This creates a person, not a login. If they also need to sign in, create a user " +
                "account separately with `createUser`.",
    )
    @ApiResponses(ApiResponse(responseCode = "200", description = "The newly created member."))
    @PreAuthorize("hasRole('ROLE_KLEIDERWART')")
    fun createMember(@Valid @RequestBody request: CreateOrUpdateMemberRequest): Member =
        service.createMember(request)

    @PatchMapping("/{id}")
    @Operation(
        operationId = "updateMember",
        summary = "Rename a member",
        description =
            "Changes a member's name. The name is the only editable field, so despite the " +
                "`PATCH` verb this replaces the whole record.",
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "The updated member."),
        ApiResponse(
            responseCode = "404",
            description = "No member exists with this id.",
            content =
                [
                    Content(
                        mediaType = "application/problem+json",
                        schema = Schema(implementation = ProblemDetail::class),
                    )
                ],
        ),
    )
    @PreAuthorize("hasRole('ROLE_KLEIDERWART')")
    fun updateMember(
        @Parameter(description = "Numeric id of the member to rename.", example = "5")
        @PathVariable
        @Positive
        id: Long,
        @Valid @RequestBody request: CreateOrUpdateMemberRequest,
    ): Member = service.updateMember(id, request)

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(
        operationId = "deleteMember",
        summary = "Remove a person from the roster",
        description =
            "Deletes a member. This removes the person from the roster only — it has no effect " +
                "on any clothing or storage location beyond clearing their ownership from linked " +
                "`PERSONAL` locations. Those locations remain present, and no user account is touched.",
    )
    @ApiResponses(
        ApiResponse(responseCode = "204", description = "The member was removed."),
        ApiResponse(
            responseCode = "404",
            description = "No member exists with this id.",
            content =
                [
                    Content(
                        mediaType = "application/problem+json",
                        schema = Schema(implementation = ProblemDetail::class),
                    )
                ],
        ),
    )
    @PreAuthorize("hasRole('ROLE_KLEIDERWART')")
    fun deleteMember(
        @Parameter(description = "Numeric id of the member to remove.", example = "5")
        @PathVariable
        @Positive
        id: Long
    ) {
        service.deleteMember(id)
    }
}

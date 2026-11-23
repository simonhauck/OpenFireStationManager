package io.github.simonhauck.openfirestationmanager.usermanagement

import io.swagger.v3.oas.annotations.media.Schema

@Schema(
    description =
        """
        What a signed-in user is allowed to do. Roles are cumulative in effect, not exclusive:

        - `USER` — read clothing data, and check garments out and back in.
        - `KLEIDERWART` — the quartermaster. Additionally create, update, and delete clothing
          types, items, and locations, run relocations and stock-takes, and see locations
          flagged `onlyVisibleForKleiderwart`.
        - `ADMIN` — implicitly granted every other role, so an admin can call every endpoint in
          this API. Additionally manages legal documents.
        """,
)
enum class UserRole {
    USER,
    ADMIN,
    KLEIDERWART,
}

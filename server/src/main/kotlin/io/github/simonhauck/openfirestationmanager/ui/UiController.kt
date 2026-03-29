package io.github.simonhauck.openfirestationmanager.ui

import org.springframework.stereotype.Controller
import org.springframework.web.bind.annotation.RequestMapping

@Controller
class UiController {

    @RequestMapping(
        value =
            [
                "/klamottenmanagement",
                "/klamottenmanagement/**",
                "/nutzermanagement",
                "/nutzermanagement/**",
            ]
    )
    fun forwardToIndex(): String {
        return "forward:/index.html"
    }
}

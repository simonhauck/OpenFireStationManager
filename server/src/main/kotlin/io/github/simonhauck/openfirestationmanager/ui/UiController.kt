package io.github.simonhauck.openfirestationmanager.ui

import org.springframework.stereotype.Controller
import org.springframework.web.bind.annotation.RequestMapping

@Controller
class UiController {

    @RequestMapping(
        value =
            [
                "/user-management",
                "/user-management/**",
                "/clothing-management",
                "/clothing-management/**",
            ]
    )
    fun forwardToIndex(): String {
        return "forward:/index.html"
    }
}

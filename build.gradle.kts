plugins { alias(libs.plugins.spotless) }

repositories { mavenCentral() }

spotless {
    kotlinGradle {
        target("*.gradle.kts")
        ktfmt().kotlinlangStyle()
    }

    json {
        target("**/*.json")
        targetExclude("client/**", "server/**", "build/**", ".gradle/**")
        prettier()
    }

    yaml {
        target("**/*.yml", "**/*.yaml")
        targetExclude("client/**", "server/**", "build/**", ".gradle/**")
        prettier()
    }
}

plugins { id("com.diffplug.spotless") version "8.4.0" }

repositories { mavenCentral() }

spotless {
    kotlin {
        target("**/*.kt")
        targetExclude("**/build/**", "**/.gradle/**")
        ktfmt().kotlinlangStyle()
    }

    kotlinGradle {
        target("**/*.gradle.kts")
        targetExclude("**/build/**", "**/.gradle/**")
        ktfmt().kotlinlangStyle()
    }
}

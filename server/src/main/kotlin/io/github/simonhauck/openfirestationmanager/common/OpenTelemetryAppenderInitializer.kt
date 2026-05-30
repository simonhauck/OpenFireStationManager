package io.github.simonhauck.openfirestationmanager.common

import ch.qos.logback.classic.Logger
import io.opentelemetry.api.OpenTelemetry
import io.opentelemetry.instrumentation.logback.appender.v1_0.OpenTelemetryAppender
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.InitializingBean
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.stereotype.Component

@Component
@ConditionalOnProperty(name = ["app.otlp.enabled"], havingValue = "true")
class OpenTelemetryAppenderInitializer(private val openTelemetry: OpenTelemetry) :
    InitializingBean {

    override fun afterPropertiesSet() {
        val loggerContext =
            LoggerFactory.getILoggerFactory() as ch.qos.logback.classic.LoggerContext
        val appender =
            OpenTelemetryAppender().apply {
                name = "OpenTelemetry"
                context = loggerContext
                setCaptureKeyValuePairAttributes(true)
                start()
            }
        (LoggerFactory.getLogger(Logger.ROOT_LOGGER_NAME) as Logger).addAppender(appender)
        OpenTelemetryAppender.install(openTelemetry)
    }
}

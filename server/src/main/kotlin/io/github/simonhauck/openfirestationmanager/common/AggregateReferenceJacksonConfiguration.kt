package io.github.simonhauck.openfirestationmanager.common

import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.data.jdbc.core.mapping.AggregateReference
import tools.jackson.core.JsonParser
import tools.jackson.core.JsonToken
import tools.jackson.databind.DeserializationContext
import tools.jackson.databind.JacksonModule
import tools.jackson.databind.SerializationContext
import tools.jackson.databind.ValueDeserializer
import tools.jackson.databind.ValueSerializer
import tools.jackson.databind.module.SimpleModule

@Configuration
class AggregateReferenceJacksonConfiguration {

    @Bean
    fun aggregateReferenceJacksonModule(): JacksonModule {
        val module = SimpleModule()
        @Suppress("UNCHECKED_CAST")
        module.addSerializer(AggregateReference::class.java, AggregateReferenceSerializer)
        @Suppress("UNCHECKED_CAST")
        module.addDeserializer(
            AggregateReference::class.java as Class<AggregateReference<*, Long>>,
            AggregateReferenceLongDeserializer,
        )
        return module
    }
}

private object AggregateReferenceSerializer : ValueSerializer<AggregateReference<*, *>>() {
    override fun serialize(
        value: AggregateReference<*, *>,
        generator: tools.jackson.core.JsonGenerator,
        ctxt: SerializationContext,
    ) {
        val id = value.id
        when (id) {
            is Int -> generator.writeNumber(id)
            is Long -> generator.writeNumber(id)
            is Short -> generator.writeNumber(id.toInt())
            is Number -> generator.writeNumber(id.toLong())
            else -> generator.writeString(id.toString())
        }
    }
}

private object AggregateReferenceLongDeserializer :
    ValueDeserializer<AggregateReference<*, Long>>() {
    override fun deserialize(
        parser: JsonParser,
        context: DeserializationContext,
    ): AggregateReference<*, Long> {
        val parsedId =
            when (parser.currentToken()) {
                JsonToken.VALUE_NUMBER_INT -> parser.longValue
                JsonToken.VALUE_STRING -> parser.valueAsString.toLongOrNull()
                JsonToken.VALUE_NULL -> null
                else -> null
            }

        val id =
            parsedId
                ?: context.reportInputMismatch(
                    AggregateReference::class.java,
                    "Expected numeric id for AggregateReference",
                )

        return AggregateReference.to<Any, Long>(id)
    }
}

package com.yyjy.service

import com.yyjy.common.ExamProperties
import io.ktor.client.*
import io.ktor.client.request.*
import io.ktor.client.statement.*
import io.ktor.http.*
import kotlinx.serialization.json.Json
import org.springframework.stereotype.Service

@kotlinx.serialization.Serializable
data class VerifyRequest(
    val secret: String,
    val response: String
)

@kotlinx.serialization.Serializable
data class VerifyResponse(
    val success: Boolean
)

@Service
class CaptchaService(private val ktorClient: HttpClient, private val examProperties: ExamProperties) {

    suspend fun verifyCaptcha(token: String): Boolean? {
        val (url, siteKey, secretKey) = examProperties.cap

        val response: HttpResponse = ktorClient.post("${url}/${siteKey}/siteverify") {
            contentType(ContentType.Application.Json)
            setBody(VerifyRequest(secret = secretKey, response = token))
        }

        if (response.status.isSuccess()) {
             val success = Json.decodeFromString<VerifyResponse>(response.bodyAsText()).success
             return success
        } else {
            return null
        }
    }
}
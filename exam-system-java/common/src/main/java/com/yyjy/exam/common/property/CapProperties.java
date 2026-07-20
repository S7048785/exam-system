package com.yyjy.exam.common.property;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "exam.cap")
public record CapProperties(String url, String siteKey, String secretKey) {
}

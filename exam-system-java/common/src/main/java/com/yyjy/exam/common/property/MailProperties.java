package com.yyjy.exam.common.property;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "exam.mail")
public record MailProperties(String from, String password, String host, int port, String username, String confirmUrl, String frontUrl) {
}

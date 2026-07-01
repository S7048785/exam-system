package com.yyjy.exam.common.property;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

@ConfigurationProperties(prefix = "exam.exclude")
public record ExcludeProperties(List<String> path) {
}

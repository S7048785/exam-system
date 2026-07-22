package com.yyjy.exam.common.util;

import com.yyjy.exam.common.property.CapProperties;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Map;

@Service
public class CaptchaService {
	
	private final WebClient webClient;
	private final CapProperties capProperties;
	
	public CaptchaService(WebClient webClient, CapProperties capProperties) {
		this.webClient = webClient;
		this.capProperties = capProperties;
	}
	
	public Boolean verifyCaptcha(String token) {
		Map<String, String> body = Map.of(
				"secret", capProperties.secretKey(),
				"response", token
		);
		
		try {
			var response = webClient.post()
					               .uri(capProperties.url() + "/" + capProperties.siteKey() + "/siteverify")
					               .header("Content-Type", "application/json")
					               .bodyValue(body)
					               .retrieve()
					               .bodyToMono(Map.class)
					               .block();
			
			if (response != null && response.containsKey("success")) {
				return (Boolean) response.get("success");
			}
			return null;
		} catch (Exception e) {
			return null;
		}
	}
}

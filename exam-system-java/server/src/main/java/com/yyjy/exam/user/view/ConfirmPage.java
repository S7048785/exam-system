package com.yyjy.exam.user.view;

import org.springframework.core.io.ClassPathResource;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

/**
 * 邮箱验证结果落地页。
 * <p>
 * 页面本体是 {@code src/main/resources/templates/} 下的两个 html —— 文案、排版都直接在 html 里改，
 * 不用碰 Java。这里只负责把里面的占位符换成真实链接：
 * <ul>
 *   <li>{@code confirm-success.html} → {@code {{LOGIN_URL}}}</li>
 *   <li>{@code confirm-fail.html} → {@code {{REGISTER_URL}}}</li>
 * </ul>
 * ⚠️ 本工程**没有引入模板引擎**（pom 里没有 Thymeleaf/Freemarker），所以 {@code templates/} 只是存放位置，
 * 不能把 {@code "confirm-success"} 当视图名返回 —— 得自己读文件再替换（就是这里做的事）。
 * 以后若要加样式，直接写进 html 即可，不会再有 Java 字符串里 {@code %} 被当成格式符的坑。
 */
public final class ConfirmPage {
	
	private static final String TEMPLATE_DIR = "templates/";
	
	private ConfirmPage() {
	}
	
	/** 验证成功：引导去登录。 */
	public static String success(String loginUrl) {
		return load("confirm-success.html").replace("{{LOGIN_URL}}", loginUrl);
	}
	
	/** 验证失败（链接不存在或已失效）：引导重新注册。 */
	public static String failure(String registerUrl) {
		return load("confirm-fail.html").replace("{{REGISTER_URL}}", registerUrl);
	}
	
	private static String load(String fileName) {
		try {
			return new ClassPathResource(TEMPLATE_DIR + fileName)
					       .getContentAsString(StandardCharsets.UTF_8);
		} catch (IOException e) {
			// 模板读不到是部署问题（resources 没打进包），不是业务异常，别混进 422
			throw new IllegalStateException("验证结果页模板缺失: " + TEMPLATE_DIR + fileName, e);
		}
	}
}

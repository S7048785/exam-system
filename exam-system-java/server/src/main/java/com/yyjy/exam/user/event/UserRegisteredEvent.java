package com.yyjy.exam.user.event;

/**
 * 用户注册成功事件。
 * <p>
 * 由 {@code UserService#registerUser} 在账号落库之后发布，验证邮件的发送交给
 * {@link UserRegisteredEmailListener} 异步处理 —— 把「注册」与「发信」解耦
 * （原 RabbitMQ 邮件队列已关闭，改用 Spring 事件做异步转发）。
 *
 * @param email 接收验证邮件的邮箱
 * @param uuid  邮箱验证用的 uuid
 */
public record UserRegisteredEvent(String email, String uuid) {
}

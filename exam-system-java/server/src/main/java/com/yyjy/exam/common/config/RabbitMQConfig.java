package com.yyjy.exam.common.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    // ========== 阅卷队列 ==========
    public static final String GRADING_EXCHANGE = "exam.grading.exchange";
    public static final String GRADING_QUEUE = "exam.grading.queue";
    public static final String GRADING_ROUTING_KEY = "exam.grading";

    // ========== 邮件队列 ==========
    public static final String MAIL_EXCHANGE = "mail.exchange";
    public static final String MAIL_QUEUE = "mail.send.queue";
    public static final String MAIL_ROUTING_KEY = "mail.send";

    // ========== 交换机 ==========

    @Bean
    public DirectExchange gradingExchange() {
        return new DirectExchange(GRADING_EXCHANGE, true, false);
    }

    @Bean
    public DirectExchange mailExchange() {
        return new DirectExchange(MAIL_EXCHANGE, true, false);
    }

    // ========== 队列 ==========

    @Bean
    public Queue gradingQueue() {
        return new Queue(GRADING_QUEUE, true);
    }

    @Bean
    public Queue mailQueue() {
        return new Queue(MAIL_QUEUE, true);
    }

    // ========== 绑定 ==========

    @Bean
    public Binding gradingBinding(Queue gradingQueue, DirectExchange gradingExchange) {
        return BindingBuilder.bind(gradingQueue).to(gradingExchange).with(GRADING_ROUTING_KEY);
    }

    @Bean
    public Binding mailBinding(Queue mailQueue, DirectExchange mailExchange) {
        return BindingBuilder.bind(mailQueue).to(mailExchange).with(MAIL_ROUTING_KEY);
    }

    // ========== 消息转换器 ==========

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}

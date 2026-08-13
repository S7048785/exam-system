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
	
	// 阅卷交换机
	public static final String GRADING_EXCHANGE = "exam.grading.exchange";
	// 阅卷队列
	public static final String GRADING_QUEUE = "exam.grading.queue";
	// 阅卷路由键
	public static final String GRADING_ROUTING_KEY = "exam.grading";
	
	@Bean
	public DirectExchange gradingExchange() {
		return new DirectExchange(GRADING_EXCHANGE, true, false);
	}
	
	@Bean
	public Queue gradingQueue() {
		return new Queue(GRADING_QUEUE, true);
	}
	
	@Bean
	public Binding gradingBinding(Queue gradingQueue, DirectExchange gradingExchange) {
		return BindingBuilder.bind(gradingQueue).to(gradingExchange).with(GRADING_ROUTING_KEY);
	}
	
	@Bean
	public MessageConverter jsonMessageConverter() {
		return new Jackson2JsonMessageConverter();
	}
}

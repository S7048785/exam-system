package com.yyjy.exam.entity.id;

import cn.hutool.core.util.RandomUtil;
import org.babyfish.jimmer.sql.meta.UserIdGenerator;

/**
 * NanoID 短码生成器 —— Jimmer 的「用户自定义 id 策略」
 */
public class NanoIdGenerator implements UserIdGenerator<String> {
	
	/**
	 * 字符集：`0-9` + `a-z`（36 个）。
	 * <p>
	 * ⚠️ 顺序固定，别随手改：已经发出去的短码要能按同一张表校验/解码，
	 * 前端做「纯小写 + 数字、长度 6」的格式校验时也依赖这里的两个常量。
	 */
	public static final String ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyz";
	
	/**
	 * 短码长度（对齐 `exam_records.public_id` 的 `varchar(6)`）。
	 */
	public static final int LENGTH = 6;
	
	/**
	 * 取一个短码。
	 * <p>
	 * ⚠️ 这是**主入口**：Jimmer 的 {@code @GeneratedValue} 只对 {@code @Id} 属性生效，
	 * 挂在普通属性上会被静默忽略（那一列根本不进 INSERT 语句），所以像
	 * `exam_records.public_id` 这种"非主键的生成列"必须在插入前由应用层赋值。
	 * 当前调用点：{@code ExamStartService#startExam}。
	 */
	public static String next() {
		return RandomUtil.randomString(ALPHABET, LENGTH);
	}
	
	/**
	 * 仅供将来把本生成器挂到某个 {@code @Id} 上时使用（{@link #next()} 的实例方法形态）。
	 */
	@Override
	public String generate(Class<?> entityType) {
		return next();
	}
}

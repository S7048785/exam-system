package com.yyjy.exam.entity.exam.io.res;

import com.yyjy.exam.entity.paper.entity.ParticipateMode;

import java.time.LocalDateTime;

/**
 * 考试入口页要展示的试卷信息（考生侧，免登录可访问）。
 *
 * @param paperId          试卷 id
 * @param name             试卷名称
 * @param description      试卷描述
 * @param start            开考时间
 * @param end              截止时间
 * @param totalScore       总分
 * @param duration         考试时长（分钟）
 * @param participateMode  考生参与方式：ANONYMOUS=免登录考试 / LOGIN_REQUIRED=账号登录考试
 */
public record ExamPaperInfoRes(
		int paperId,
		String name,
		String description,
		LocalDateTime start,
		LocalDateTime end,
		int totalScore,
		int duration,
		ParticipateMode participateMode
) {
}

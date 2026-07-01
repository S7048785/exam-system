package com.yyjy.exam.exam.repository;

import com.yyjy.exam.entity.exam.entity.AnswerRecord;
import org.babyfish.jimmer.spring.repository.JRepository;

import java.util.List;

public interface AnswerRecordRepository extends JRepository<AnswerRecord, Integer> {

    List<AnswerRecord> findByExamRecordId(int examRecordId);
}

package com.yyjy.exam.entity.paper.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaperAiSaveDto {
    private String name;
    private String description;
    private int duration;
    private List<Rule> rules;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Rule {
        private String type;
        private List<Long> categoryIds;
        private int count;
        private int score;
    }
}

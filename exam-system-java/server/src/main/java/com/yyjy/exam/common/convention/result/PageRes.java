package com.yyjy.exam.common.convention.result;

import lombok.Builder;

import java.io.Serializable;
import java.util.List;

@Builder
public record PageRes<T>(Long total, Integer page, Integer pageSize, List<T> list) implements Serializable {
}

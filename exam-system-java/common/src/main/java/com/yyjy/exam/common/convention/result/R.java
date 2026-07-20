package com.yyjy.exam.common.convention.result;

import java.io.Serializable;

public record R<T>(Integer code, String msg, T data) implements Serializable {

    public static <T> R<T> ok(T data) {
        return new R<>(200, "ok", data);
    }

    public static <T> R<T> ok() {
        return new R<>(200, "ok", null);
    }

    public static <T> R<T> fail(String msg) {
        return new R<>(500, msg, null);
    }
}

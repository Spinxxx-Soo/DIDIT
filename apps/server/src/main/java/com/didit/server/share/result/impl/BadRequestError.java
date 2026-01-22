package com.didit.server.share.result.impl;

import java.util.Map;

/**
 * 400 Bad Request 에러를 처리하기 위한 심플한 커스텀 에러 클래스
 */
public class BadRequestError extends SimpleError {

    public BadRequestError(String message) {
        super(400, message);
    }

    public BadRequestError(String fieldName, String message) {
        super(400, message, Map.of("field", fieldName));
    }
}
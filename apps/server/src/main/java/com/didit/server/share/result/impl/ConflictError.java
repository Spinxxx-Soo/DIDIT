package com.didit.server.share.result.impl;

public final class ConflictError extends SimpleError {
    public ConflictError(String message) {
        super(409, message);
    }
}
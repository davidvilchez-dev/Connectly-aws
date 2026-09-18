package com.david.connectly.backend.exception;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
@AllArgsConstructor
public class ErrorResponse {
    private String message;
    private int statusCode;
    private LocalDateTime timestamp;
    private List<String> errorDetails;
}

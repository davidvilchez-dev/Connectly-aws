package com.david.connectly.backend.dto.response;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class CommentResponse {
    private Long id;
    private String content;
    private UserResponse user;
    private Long postId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

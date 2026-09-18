package com.david.connectly.backend.dto.response;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class PostResponse {
    private Long id;
    private String content;
    private String imageUrl;
    private UserResponse user;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private int commentsCount;
    private int likesCount;
    private boolean liked;
}

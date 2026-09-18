package com.david.connectly.backend.dto.request;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Data
public class CommentRequest {

    @NotBlank(message = "Content is required")
    private String content;

    @NotNull(message = "Post ID is required")
    private Long postId;
}

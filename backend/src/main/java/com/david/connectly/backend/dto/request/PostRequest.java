package com.david.connectly.backend.dto.request;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;

@Data
public class PostRequest {

    @NotBlank(message = "Content is required")
    private String content;

    private String imageUrl;
}

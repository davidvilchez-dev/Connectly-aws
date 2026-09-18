package com.david.connectly.backend.dto.request;

import lombok.Data;
import jakarta.validation.constraints.Size;

@Data
public class UpdateProfileRequest {

    @Size(max = 50, message = "Username must be at most 50 characters")
    private String username;

    private String bio;

    private String avatarUrl;
}

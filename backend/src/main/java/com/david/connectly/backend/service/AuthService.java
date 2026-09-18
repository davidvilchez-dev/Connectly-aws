package com.david.connectly.backend.service;

import com.david.connectly.backend.dto.request.LoginRequest;
import com.david.connectly.backend.dto.request.RegisterRequest;
import com.david.connectly.backend.dto.response.AuthResponse;

public interface AuthService {
    AuthResponse register(RegisterRequest request);

    AuthResponse login(LoginRequest request);
}

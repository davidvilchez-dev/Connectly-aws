package com.david.connectly.backend.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Collections;
import java.util.HashMap;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("JwtService - Pruebas unitarias")
class JwtServiceTest {

    private JwtService jwtService;
    private UserDetails userDetails;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        // Inject fields normally populated by @Value
        ReflectionTestUtils.setField(jwtService, "secretKey", "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970");
        ReflectionTestUtils.setField(jwtService, "jwtExpiration", 86400000L); // 24 hours

        userDetails = new User("test@test.com", "password", Collections.emptyList());
    }

    @Test
    @DisplayName("generateToken: genera un token válido a partir de UserDetails")
    void generateToken_shouldGenerateToken() {
        String token = jwtService.generateToken(userDetails);
        
        assertThat(token).isNotEmpty();
        assertThat(jwtService.extractUsername(token)).isEqualTo("test@test.com");
    }

    @Test
    @DisplayName("generateToken: genera un token válido con reclamos adicionales")
    void generateTokenWithExtraClaims_shouldGenerateToken() {
        HashMap<String, Object> extra = new HashMap<>();
        extra.put("role", "ROLE_USER");

        String token = jwtService.generateToken(extra, userDetails);

        assertThat(token).isNotEmpty();
        assertThat(jwtService.extractUsername(token)).isEqualTo("test@test.com");
        String role = jwtService.extractClaim(token, claims -> (String) claims.get("role"));
        assertThat(role).isEqualTo("ROLE_USER");
    }

    @Test
    @DisplayName("isTokenValid: retorna true para tokens válidos")
    void isTokenValid_shouldReturnTrue_whenTokenIsValid() {
        String token = jwtService.generateToken(userDetails);
        
        assertThat(jwtService.isTokenValid(token, userDetails)).isTrue();
    }

    @Test
    @DisplayName("isTokenValid: retorna false si el username no coincide")
    void isTokenValid_shouldReturnFalse_whenUsernameDoesNotMatch() {
        String token = jwtService.generateToken(userDetails);
        UserDetails differentUser = new User("other@test.com", "password", Collections.emptyList());

        assertThat(jwtService.isTokenValid(token, differentUser)).isFalse();
    }
}

package com.david.connectly.backend.security;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collections;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@DisplayName("SecurityUtils - Pruebas unitarias")
class SecurityUtilsTest {

    private SecurityContext originalContext;

    @BeforeEach
    void setUp() {
        originalContext = SecurityContextHolder.getContext();
        SecurityContextHolder.clearContext();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.setContext(originalContext);
    }

    @Test
    @DisplayName("getCurrentUserEmail: retorna null si no hay autenticación")
    void getCurrentUserEmail_shouldReturnNull_whenNoAuthentication() {
        assertThat(SecurityUtils.getCurrentUserEmail()).isNull();
    }

    @Test
    @DisplayName("getCurrentUserEmail: retorna null si el principal es null")
    void getCurrentUserEmail_shouldReturnNull_whenPrincipalIsNull() {
        SecurityContext context = mock(SecurityContext.class);
        Authentication auth = mock(Authentication.class);
        when(auth.getPrincipal()).thenReturn(null);
        when(context.getAuthentication()).thenReturn(auth);
        SecurityContextHolder.setContext(context);

        assertThat(SecurityUtils.getCurrentUserEmail()).isNull();
    }

    @Test
    @DisplayName("getCurrentUserEmail: retorna email si principal es UserDetails")
    void getCurrentUserEmail_shouldReturnEmail_whenPrincipalIsUserDetails() {
        SecurityContext context = mock(SecurityContext.class);
        Authentication auth = mock(Authentication.class);
        UserDetails userDetails = new User("user@test.com", "password", Collections.emptyList());
        
        when(auth.getPrincipal()).thenReturn(userDetails);
        when(context.getAuthentication()).thenReturn(auth);
        SecurityContextHolder.setContext(context);

        assertThat(SecurityUtils.getCurrentUserEmail()).isEqualTo("user@test.com");
    }

    @Test
    @DisplayName("getCurrentUserEmail: retorna email si principal es un String")
    void getCurrentUserEmail_shouldReturnEmail_whenPrincipalIsString() {
        SecurityContext context = mock(SecurityContext.class);
        Authentication auth = mock(Authentication.class);
        
        when(auth.getPrincipal()).thenReturn("string@test.com");
        when(context.getAuthentication()).thenReturn(auth);
        SecurityContextHolder.setContext(context);

        assertThat(SecurityUtils.getCurrentUserEmail()).isEqualTo("string@test.com");
    }

    @Test
    @DisplayName("getCurrentUserEmail: retorna null si principal es de otro tipo")
    void getCurrentUserEmail_shouldReturnNull_whenPrincipalIsUnknownType() {
        SecurityContext context = mock(SecurityContext.class);
        Authentication auth = mock(Authentication.class);
        
        when(auth.getPrincipal()).thenReturn(new Object());
        when(context.getAuthentication()).thenReturn(auth);
        SecurityContextHolder.setContext(context);

        assertThat(SecurityUtils.getCurrentUserEmail()).isNull();
    }
}

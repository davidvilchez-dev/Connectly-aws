package com.david.connectly.backend.security;

import com.david.connectly.backend.entity.User;
import com.david.connectly.backend.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("CustomUserDetailsService - Pruebas unitarias")
class CustomUserDetailsServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private CustomUserDetailsService userDetailsService;

    @Test
    @DisplayName("loadUserByUsername: retorna UserDetails cuando el email existe")
    void loadUserByUsername_shouldReturnUserDetails_whenEmailExists() {
        User user = new User();
        user.setEmail("test@test.com");
        user.setPassword("password123");

        when(userRepository.findByEmail("test@test.com")).thenReturn(Optional.of(user));

        UserDetails result = userDetailsService.loadUserByUsername("test@test.com");

        assertThat(result).isNotNull();
        assertThat(result.getUsername()).isEqualTo("test@test.com");
    }

    @Test
    @DisplayName("loadUserByUsername: lanza UsernameNotFoundException cuando el email no existe")
    void loadUserByUsername_shouldThrowException_whenEmailDoesNotExist() {
        when(userRepository.findByEmail("nonexistent@test.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userDetailsService.loadUserByUsername("nonexistent@test.com"))
                .isInstanceOf(UsernameNotFoundException.class)
                .hasMessageContaining("User not found with email/username: nonexistent@test.com");
    }
}

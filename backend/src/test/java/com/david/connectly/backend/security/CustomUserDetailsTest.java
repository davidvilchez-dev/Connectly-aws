package com.david.connectly.backend.security;

import com.david.connectly.backend.entity.User;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.GrantedAuthority;

import java.util.Collection;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("CustomUserDetails - Pruebas unitarias")
class CustomUserDetailsTest {

    @Test
    @DisplayName("Debería retornar los datos correctos del User subyacente")
    void shouldReturnCorrectUserDetailsData() {
        User user = new User();
        user.setId(1L);
        user.setEmail("test@test.com");
        user.setPassword("password123");

        CustomUserDetails userDetails = new CustomUserDetails(user);

        assertThat(userDetails.getUser()).isEqualTo(user);
        assertThat(userDetails.getPassword()).isEqualTo("password123");
        assertThat(userDetails.getUsername()).isEqualTo("test@test.com");
        
        Collection<? extends GrantedAuthority> authorities = userDetails.getAuthorities();
        assertThat(authorities).hasSize(1);
        assertThat(authorities.iterator().next().getAuthority()).isEqualTo("ROLE_USER");

        assertThat(userDetails.isAccountNonExpired()).isTrue();
        assertThat(userDetails.isAccountNonLocked()).isTrue();
        assertThat(userDetails.isCredentialsNonExpired()).isTrue();
        assertThat(userDetails.isEnabled()).isTrue();
    }
}

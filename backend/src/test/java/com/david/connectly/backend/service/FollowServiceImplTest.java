package com.david.connectly.backend.service;

import com.david.connectly.backend.entity.Follow;
import com.david.connectly.backend.entity.User;
import com.david.connectly.backend.exception.ConflictException;
import com.david.connectly.backend.exception.ResourceNotFoundException;
import com.david.connectly.backend.repository.FollowRepository;
import com.david.connectly.backend.repository.UserRepository;
import com.david.connectly.backend.service.impl.FollowServiceImpl;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("FollowServiceImpl - Pruebas unitarias")
class FollowServiceImplTest {

    @Mock private FollowRepository followRepository;
    @Mock private UserRepository userRepository;

    @InjectMocks
    private FollowServiceImpl followService;

    private User follower;
    private User following;

    @BeforeEach
    void setUp() {
        follower = new User();
        follower.setId(1L);
        follower.setEmail("david@test.com");

        following = new User();
        following.setId(2L);
        following.setEmail("otro@test.com");

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("david@test.com", null, List.of())
        );
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    // ─── FOLLOW USER ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("followUser: sigue al usuario correctamente")
    void followUser_shouldSaveFollow_whenValid() {
        when(userRepository.findByEmail("david@test.com")).thenReturn(Optional.of(follower));
        when(userRepository.findById(2L)).thenReturn(Optional.of(following));
        when(followRepository.findByFollowerIdAndFollowingId(1L, 2L)).thenReturn(Optional.empty());

        assertThatNoException().isThrownBy(() -> followService.followUser(2L));
        verify(followRepository).save(any(Follow.class));
    }

    @Test
    @DisplayName("followUser: lanza ConflictException si intenta seguirse a sí mismo")
    void followUser_shouldThrow_whenFollowingSelf() {
        when(userRepository.findByEmail("david@test.com")).thenReturn(Optional.of(follower));

        assertThatThrownBy(() -> followService.followUser(1L))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("cannot follow yourself");

        verify(followRepository, never()).save(any());
    }

    @Test
    @DisplayName("followUser: lanza ConflictException si ya sigue al usuario")
    void followUser_shouldThrow_whenAlreadyFollowing() {
        Follow existingFollow = new Follow();

        when(userRepository.findByEmail("david@test.com")).thenReturn(Optional.of(follower));
        when(userRepository.findById(2L)).thenReturn(Optional.of(following));
        when(followRepository.findByFollowerIdAndFollowingId(1L, 2L)).thenReturn(Optional.of(existingFollow));

        assertThatThrownBy(() -> followService.followUser(2L))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("Already following");
    }

    @Test
    @DisplayName("followUser: lanza ResourceNotFoundException si el usuario destino no existe")
    void followUser_shouldThrow_whenTargetUserNotFound() {
        when(userRepository.findByEmail("david@test.com")).thenReturn(Optional.of(follower));
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> followService.followUser(99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("99");
    }

    // ─── UNFOLLOW USER ────────────────────────────────────────────────────────

    @Test
    @DisplayName("unfollowUser: deja de seguir al usuario correctamente")
    void unfollowUser_shouldDeleteFollow_whenRelationExists() {
        Follow follow = new Follow();

        when(userRepository.findByEmail("david@test.com")).thenReturn(Optional.of(follower));
        when(followRepository.findByFollowerIdAndFollowingId(1L, 2L)).thenReturn(Optional.of(follow));

        assertThatNoException().isThrownBy(() -> followService.unfollowUser(2L));
        verify(followRepository).delete(follow);
    }

    @Test
    @DisplayName("unfollowUser: lanza ResourceNotFoundException si no existe la relación")
    void unfollowUser_shouldThrow_whenNotFollowing() {
        when(userRepository.findByEmail("david@test.com")).thenReturn(Optional.of(follower));
        when(followRepository.findByFollowerIdAndFollowingId(1L, 99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> followService.unfollowUser(99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Follow relation not found");
    }

    // ─── IS FOLLOWING ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("isFollowing: retorna true cuando existe la relación de seguimiento")
    void isFollowing_shouldReturnTrue_whenFollowingExists() {
        when(userRepository.findByEmail("david@test.com")).thenReturn(Optional.of(follower));
        when(userRepository.findById(2L)).thenReturn(Optional.of(following));
        when(followRepository.findByFollowerIdAndFollowingId(1L, 2L)).thenReturn(Optional.of(new Follow()));

        Boolean result = followService.isFollowing(2L);

        assertThat(result).isTrue();
    }

    @Test
    @DisplayName("isFollowing: retorna false cuando no existe la relación de seguimiento")
    void isFollowing_shouldReturnFalse_whenNotFollowing() {
        when(userRepository.findByEmail("david@test.com")).thenReturn(Optional.of(follower));
        when(userRepository.findById(2L)).thenReturn(Optional.of(following));
        when(followRepository.findByFollowerIdAndFollowingId(1L, 2L)).thenReturn(Optional.empty());

        Boolean result = followService.isFollowing(2L);

        assertThat(result).isFalse();
    }

    @Test
    @DisplayName("isFollowing: lanza ResourceNotFoundException si el usuario destino no existe")
    void isFollowing_shouldThrow_whenTargetUserNotFound() {
        when(userRepository.findByEmail("david@test.com")).thenReturn(Optional.of(follower));
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> followService.isFollowing(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // ─── FOLLOW/UNFOLLOW ADDITIONAL ───────────────────────────────────────────

    @Test
    @DisplayName("followUser: lanza excepción si no está autenticado")
    void followUser_shouldThrow_whenNotAuthenticated() {
        SecurityContextHolder.clearContext();
        assertThatThrownBy(() -> followService.followUser(2L))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("followUser: lanza excepción si el usuario autenticado no existe en bd")
    void followUser_shouldThrow_whenUserNotFound() {
        when(userRepository.findByEmail("david@test.com")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> followService.followUser(2L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("unfollowUser: lanza excepción si no está autenticado")
    void unfollowUser_shouldThrow_whenNotAuthenticated() {
        SecurityContextHolder.clearContext();
        assertThatThrownBy(() -> followService.unfollowUser(2L))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("unfollowUser: lanza excepción si el usuario autenticado no existe en bd")
    void unfollowUser_shouldThrow_whenUserNotFound() {
        when(userRepository.findByEmail("david@test.com")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> followService.unfollowUser(2L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("isFollowing: lanza excepción si no está autenticado")
    void isFollowing_shouldThrow_whenNotAuthenticated() {
        SecurityContextHolder.clearContext();
        assertThatThrownBy(() -> followService.isFollowing(2L))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("isFollowing: lanza excepción si el usuario autenticado no existe en bd")
    void isFollowing_shouldThrow_whenUserNotFound() {
        when(userRepository.findByEmail("david@test.com")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> followService.isFollowing(2L))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}

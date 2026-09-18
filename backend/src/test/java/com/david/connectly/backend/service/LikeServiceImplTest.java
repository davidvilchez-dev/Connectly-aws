package com.david.connectly.backend.service;

import com.david.connectly.backend.entity.Like;
import com.david.connectly.backend.entity.Post;
import com.david.connectly.backend.entity.User;
import com.david.connectly.backend.exception.ConflictException;
import com.david.connectly.backend.exception.ResourceNotFoundException;
import com.david.connectly.backend.repository.LikeRepository;
import com.david.connectly.backend.repository.PostRepository;
import com.david.connectly.backend.repository.UserRepository;
import com.david.connectly.backend.service.impl.LikeServiceImpl;
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
@DisplayName("LikeServiceImpl - Pruebas unitarias")
class LikeServiceImplTest {

    @Mock private LikeRepository likeRepository;
    @Mock private PostRepository postRepository;
    @Mock private UserRepository userRepository;

    @InjectMocks
    private LikeServiceImpl likeService;

    private User user;
    private Post post;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(1L);
        user.setEmail("david@test.com");

        post = new Post();
        post.setId(10L);

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("david@test.com", null, List.of())
        );
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    // ─── LIKE POST ────────────────────────────────────────────────────────────

    @Test
    @DisplayName("likePost: da like correctamente cuando no existe previo")
    void likePost_shouldSaveLike_whenNotAlreadyLiked() {
        when(userRepository.findByEmail("david@test.com")).thenReturn(Optional.of(user));
        when(postRepository.findById(10L)).thenReturn(Optional.of(post));
        when(likeRepository.findByPostIdAndUserId(10L, 1L)).thenReturn(Optional.empty());

        assertThatNoException().isThrownBy(() -> likeService.likePost(10L));
        verify(likeRepository).save(any(Like.class));
    }

    @Test
    @DisplayName("likePost: lanza ConflictException si el like ya existe")
    void likePost_shouldThrow_whenLikeAlreadyExists() {
        Like existingLike = new Like();

        when(userRepository.findByEmail("david@test.com")).thenReturn(Optional.of(user));
        when(postRepository.findById(10L)).thenReturn(Optional.of(post));
        when(likeRepository.findByPostIdAndUserId(10L, 1L)).thenReturn(Optional.of(existingLike));

        assertThatThrownBy(() -> likeService.likePost(10L))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("Like already exists");

        verify(likeRepository, never()).save(any());
    }

    @Test
    @DisplayName("likePost: lanza ResourceNotFoundException si el post no existe")
    void likePost_shouldThrow_whenPostNotFound() {
        when(userRepository.findByEmail("david@test.com")).thenReturn(Optional.of(user));
        when(postRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> likeService.likePost(99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("99");
    }

    // ─── UNLIKE POST ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("unlikePost: quita el like correctamente cuando existe")
    void unlikePost_shouldDeleteLike_whenLikeExists() {
        Like like = new Like();

        when(userRepository.findByEmail("david@test.com")).thenReturn(Optional.of(user));
        when(likeRepository.findByPostIdAndUserId(10L, 1L)).thenReturn(Optional.of(like));

        assertThatNoException().isThrownBy(() -> likeService.unlikePost(10L));
        verify(likeRepository).delete(like);
    }

    @Test
    @DisplayName("unlikePost: lanza ResourceNotFoundException si no hay like previo")
    void unlikePost_shouldThrow_whenLikeNotFound() {
        when(userRepository.findByEmail("david@test.com")).thenReturn(Optional.of(user));
        when(likeRepository.findByPostIdAndUserId(10L, 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> likeService.unlikePost(10L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Like not found");
    }

    // ─── GET LIKES COUNT ─────────────────────────────────────────────────────

    @Test
    @DisplayName("getLikesCount: retorna el conteo de likes de un post")
    void getLikesCount_shouldReturnCount_whenPostExists() {
        when(postRepository.findById(10L)).thenReturn(Optional.of(post));
        when(likeRepository.countByPostId(10L)).thenReturn(5L);

        Long result = likeService.getLikesCount(10L);

        assertThat(result).isEqualTo(5L);
    }

    @Test
    @DisplayName("getLikesCount: lanza ResourceNotFoundException si el post no existe")
    void getLikesCount_shouldThrow_whenPostNotFound() {
        when(postRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> likeService.getLikesCount(99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("99");
    }

    // ─── LIKE/UNLIKE POST ADDITIONAL ──────────────────────────────────────────

    @Test
    @DisplayName("likePost: lanza excepción si no está autenticado")
    void likePost_shouldThrow_whenNotAuthenticated() {
        SecurityContextHolder.clearContext();
        assertThatThrownBy(() -> likeService.likePost(10L))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("likePost: lanza excepción si el usuario autenticado no existe en bd")
    void likePost_shouldThrow_whenUserNotFound() {
        when(userRepository.findByEmail("david@test.com")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> likeService.likePost(10L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("unlikePost: lanza excepción si no está autenticado")
    void unlikePost_shouldThrow_whenNotAuthenticated() {
        SecurityContextHolder.clearContext();
        assertThatThrownBy(() -> likeService.unlikePost(10L))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("unlikePost: lanza excepción si el usuario autenticado no existe en bd")
    void unlikePost_shouldThrow_whenUserNotFound() {
        when(userRepository.findByEmail("david@test.com")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> likeService.unlikePost(10L))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}

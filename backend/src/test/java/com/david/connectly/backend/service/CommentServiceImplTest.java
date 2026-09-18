package com.david.connectly.backend.service;

import com.david.connectly.backend.dto.request.CommentRequest;
import com.david.connectly.backend.dto.response.CommentResponse;
import com.david.connectly.backend.entity.Comment;
import com.david.connectly.backend.entity.Post;
import com.david.connectly.backend.entity.User;
import com.david.connectly.backend.exception.ConflictException;
import com.david.connectly.backend.exception.ResourceNotFoundException;
import com.david.connectly.backend.mapper.CommentMapper;
import com.david.connectly.backend.repository.CommentRepository;
import com.david.connectly.backend.repository.PostRepository;
import com.david.connectly.backend.repository.UserRepository;
import com.david.connectly.backend.service.impl.CommentServiceImpl;
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
@DisplayName("CommentServiceImpl - Pruebas unitarias")
class CommentServiceImplTest {

    @Mock private CommentRepository commentRepository;
    @Mock private PostRepository postRepository;
    @Mock private UserRepository userRepository;
    @Mock private CommentMapper commentMapper;

    @InjectMocks
    private CommentServiceImpl commentService;

    private User user;
    private Post post;
    private Comment comment;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(1L);
        user.setEmail("david@test.com");

        post = new Post();
        post.setId(10L);

        comment = new Comment();
        comment.setId(100L);
        comment.setUser(user);
        comment.setPost(post);

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("david@test.com", null, List.of())
        );
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    // ─── GET COMMENTS BY POST ─────────────────────────────────────────────────

    @Test
    @DisplayName("getCommentsByPostId: retorna comentarios del post ordenados por fecha")
    void getCommentsByPostId_shouldReturnComments_whenPostExists() {
        CommentResponse commentResponse = new CommentResponse();

        when(postRepository.findById(10L)).thenReturn(Optional.of(post));
        when(commentRepository.findAllByPostIdOrderByCreatedAtAsc(10L)).thenReturn(List.of(comment));
        when(commentMapper.toResponse(comment)).thenReturn(commentResponse);

        List<CommentResponse> result = commentService.getCommentsByPostId(10L);

        assertThat(result).hasSize(1).contains(commentResponse);
    }

    @Test
    @DisplayName("getCommentsByPostId: lanza ResourceNotFoundException si el post no existe")
    void getCommentsByPostId_shouldThrow_whenPostNotFound() {
        when(postRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> commentService.getCommentsByPostId(99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("99");
    }

    // ─── ADD COMMENT ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("addComment: agrega comentario correctamente cuando el usuario está autenticado")
    void addComment_shouldSaveComment_whenAuthenticated() {
        CommentRequest request = new CommentRequest();
        CommentResponse commentResponse = new CommentResponse();

        when(userRepository.findByEmail("david@test.com")).thenReturn(Optional.of(user));
        when(postRepository.findById(10L)).thenReturn(Optional.of(post));
        when(commentMapper.toEntity(request)).thenReturn(comment);
        when(commentRepository.save(any(Comment.class))).thenReturn(comment);
        when(commentMapper.toResponse(comment)).thenReturn(commentResponse);

        CommentResponse result = commentService.addComment(10L, request);

        assertThat(result).isEqualTo(commentResponse);
        verify(commentRepository).save(any(Comment.class));
    }

    @Test
    @DisplayName("addComment: lanza ResourceNotFoundException si el post no existe")
    void addComment_shouldThrow_whenPostNotFound() {
        when(userRepository.findByEmail("david@test.com")).thenReturn(Optional.of(user));
        when(postRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> commentService.addComment(99L, new CommentRequest()))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // ─── DELETE COMMENT ───────────────────────────────────────────────────────

    @Test
    @DisplayName("deleteComment: elimina el comentario cuando pertenece al usuario autenticado")
    void deleteComment_shouldDelete_whenCommentBelongsToUser() {
        when(userRepository.findByEmail("david@test.com")).thenReturn(Optional.of(user));
        when(commentRepository.findById(100L)).thenReturn(Optional.of(comment));

        assertThatNoException().isThrownBy(() -> commentService.deleteComment(100L));
        verify(commentRepository).delete(comment);
    }

    @Test
    @DisplayName("deleteComment: lanza ConflictException si el comentario es de otro usuario")
    void deleteComment_shouldThrow_whenCommentBelongsToOtherUser() {
        User otherUser = new User();
        otherUser.setId(99L);
        comment.setUser(otherUser);

        when(userRepository.findByEmail("david@test.com")).thenReturn(Optional.of(user));
        when(commentRepository.findById(100L)).thenReturn(Optional.of(comment));

        assertThatThrownBy(() -> commentService.deleteComment(100L))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("your own comments");

        verify(commentRepository, never()).delete(any());
    }

    @Test
    @DisplayName("deleteComment: lanza ResourceNotFoundException si el comentario no existe")
    void deleteComment_shouldThrow_whenCommentNotFound() {
        when(userRepository.findByEmail("david@test.com")).thenReturn(Optional.of(user));
        when(commentRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> commentService.deleteComment(999L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // ─── ADD/DELETE COMMENT ADDITIONAL ─────────────────────────────────────────

    @Test
    @DisplayName("addComment: lanza excepción si no está autenticado")
    void addComment_shouldThrow_whenNotAuthenticated() {
        SecurityContextHolder.clearContext();
        assertThatThrownBy(() -> commentService.addComment(10L, new CommentRequest()))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("addComment: lanza excepción si el usuario autenticado no existe en bd")
    void addComment_shouldThrow_whenUserNotFound() {
        when(userRepository.findByEmail("david@test.com")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> commentService.addComment(10L, new CommentRequest()))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("deleteComment: lanza excepción si no está autenticado")
    void deleteComment_shouldThrow_whenNotAuthenticated() {
        SecurityContextHolder.clearContext();
        assertThatThrownBy(() -> commentService.deleteComment(100L))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("deleteComment: lanza excepción si el usuario autenticado no existe en bd")
    void deleteComment_shouldThrow_whenUserNotFound() {
        when(userRepository.findByEmail("david@test.com")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> commentService.deleteComment(100L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("updateComment: actualiza comentario exitosamente cuando pertenece al usuario")
    void updateComment_shouldUpdate_whenCommentBelongsToUser() {
        CommentRequest request = new CommentRequest();
        request.setContent("Updated content");
        CommentResponse updatedResponse = new CommentResponse();

        when(userRepository.findByEmail("david@test.com")).thenReturn(Optional.of(user));
        when(commentRepository.findById(100L)).thenReturn(Optional.of(comment));
        when(commentRepository.save(any(Comment.class))).thenReturn(comment);
        when(commentMapper.toResponse(comment)).thenReturn(updatedResponse);

        CommentResponse result = commentService.updateComment(100L, request);

        assertThat(result).isEqualTo(updatedResponse);
        verify(commentRepository).save(any(Comment.class));
    }

    @Test
    @DisplayName("updateComment: lanza ConflictException si el comentario es de otro usuario")
    void updateComment_shouldThrow_whenCommentBelongsToOtherUser() {
        CommentRequest request = new CommentRequest();
        request.setContent("Updated");

        // Escenario 1: currentEmail == null
        SecurityContextHolder.clearContext();
        assertThatThrownBy(() -> commentService.updateComment(100L, request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("No autorizado");

        // Restaurar SecurityContext para los siguientes escenarios
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("david@test.com", null, List.of())
        );

        // Escenario 2: comment.getUser() == null
        Comment commentNoUser = new Comment();
        commentNoUser.setId(100L);
        commentNoUser.setUser(null);

        when(userRepository.findByEmail("david@test.com")).thenReturn(Optional.of(user));
        when(commentRepository.findById(100L)).thenReturn(Optional.of(commentNoUser));

        assertThatThrownBy(() -> commentService.updateComment(100L, request))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("Solo puedes editar");

        // Escenario 3: comment.getUser().getId() == null
        Comment commentUserIdNull = new Comment();
        commentUserIdNull.setId(100L);
        User userWithNullId = new User();
        userWithNullId.setId(null);
        commentUserIdNull.setUser(userWithNullId);

        when(commentRepository.findById(100L)).thenReturn(Optional.of(commentUserIdNull));

        assertThatThrownBy(() -> commentService.updateComment(100L, request))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("Solo puedes editar");

        // Escenario 4: !comment.getUser().getId().equals(user.getId()) (comentario pertenece a otro usuario)
        User otherUser = new User();
        otherUser.setId(99L);
        comment.setUser(otherUser);

        when(commentRepository.findById(100L)).thenReturn(Optional.of(comment));

        assertThatThrownBy(() -> commentService.updateComment(100L, request))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("Solo puedes editar");
    }
}

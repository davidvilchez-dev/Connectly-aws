package com.david.connectly.backend.service;

import com.david.connectly.backend.dto.request.PostRequest;
import com.david.connectly.backend.dto.response.PostResponse;
import com.david.connectly.backend.entity.Post;
import com.david.connectly.backend.entity.User;
import com.david.connectly.backend.entity.Like;
import com.david.connectly.backend.exception.ConflictException;
import com.david.connectly.backend.exception.ResourceNotFoundException;
import com.david.connectly.backend.mapper.PostMapper;
import com.david.connectly.backend.repository.PostRepository;
import com.david.connectly.backend.repository.UserRepository;
import com.david.connectly.backend.repository.LikeRepository;
import com.david.connectly.backend.security.SecurityUtils;
import com.david.connectly.backend.service.impl.PostServiceImpl;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.mock.web.MockMultipartFile;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("PostServiceImpl - Pruebas unitarias")
class PostServiceImplTest {

    @Mock
    private PostRepository postRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private PostMapper postMapper;
    @Mock
    private CloudinaryService cloudinaryService;
    @Mock
    private LikeRepository likeRepository;

    @InjectMocks
    private PostServiceImpl postService;

    private User user;
    private Post post;
    private PostResponse postResponse;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(1L);
        user.setEmail("david@test.com");

        post = new Post();
        post.setId(10L);
        post.setUser(user);

        postResponse = new PostResponse();

        // Simula usuario autenticado en el SecurityContext
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("david@test.com", null, List.of()));
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    // ─── GET POST BY ID ───────────────────────────────────────────────────────

    @Test
    @DisplayName("getPostById: retorna PostResponse cuando el post existe")
    void getPostById_shouldReturnPost_whenExists() {
        when(postRepository.findById(10L)).thenReturn(Optional.of(post));
        when(postMapper.toResponse(post)).thenReturn(postResponse);

        PostResponse result = postService.getPostById(10L);

        assertThat(result).isEqualTo(postResponse);
        verify(postRepository).findById(10L);
    }

    @Test
    @DisplayName("getPostById: lanza ResourceNotFoundException cuando no existe")
    void getPostById_shouldThrow_whenNotFound() {
        when(postRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> postService.getPostById(99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("99");
    }

    // ─── EXPLORE / FEED ───────────────────────────────────────────────────────

    @Test
    @DisplayName("explorePosts: retorna lista de posts ordenados por fecha")
    void explorePosts_shouldReturnAllPostsOrderedByDate() {
        when(postRepository.findAllByOrderByCreatedAtDesc()).thenReturn(List.of(post));
        when(postMapper.toResponse(post)).thenReturn(postResponse);

        List<PostResponse> result = postService.explorePosts();

        assertThat(result).hasSize(1).contains(postResponse);
    }

    @Test
    @DisplayName("getFeed: delega a explorePosts y retorna su resultado")
    void getFeed_shouldDelegateToExplorePosts() {
        when(postRepository.findAllByOrderByCreatedAtDesc()).thenReturn(List.of(post));
        when(postMapper.toResponse(post)).thenReturn(postResponse);

        List<PostResponse> result = postService.getFeed();

        assertThat(result).hasSize(1);
    }

    // ─── CREATE POST ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("createPost: crea post exitosamente para el usuario autenticado")
    void createPost_shouldCreateAndReturnPost_whenAuthenticated() {
        PostRequest request = new PostRequest();

        when(userRepository.findByEmail("david@test.com")).thenReturn(Optional.of(user));
        when(postMapper.toEntity(request)).thenReturn(post);
        when(postRepository.save(any(Post.class))).thenReturn(post);
        when(postMapper.toResponse(post)).thenReturn(postResponse);

        PostResponse result = postService.createPost(request);

        assertThat(result).isEqualTo(postResponse);
        verify(postRepository).save(any(Post.class));
    }

    @Test
    @DisplayName("createPost: lanza excepción si no hay usuario autenticado")
    void createPost_shouldThrow_whenNotAuthenticated() {
        SecurityContextHolder.clearContext();

        try (MockedStatic<SecurityUtils> utils = mockStatic(SecurityUtils.class)) {
            utils.when(SecurityUtils::getCurrentUserEmail).thenReturn(null);

            PostRequest request = new PostRequest();

            assertThatThrownBy(() -> postService.createPost(request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage("Unauthorized");
        }
    }

    // ─── DELETE POST ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("deletePost: elimina el post cuando pertenece al usuario autenticado")
    void deletePost_shouldDelete_whenPostBelongsToUser() {
        when(userRepository.findByEmail("david@test.com")).thenReturn(Optional.of(user));
        when(postRepository.findById(10L)).thenReturn(Optional.of(post));

        assertThatNoException().isThrownBy(() -> postService.deletePost(10L));
        verify(postRepository).delete(post);
    }

    @Test
    @DisplayName("deletePost: lanza ConflictException si el post es de otro usuario")
    void deletePost_shouldThrow_whenPostBelongsToOtherUser() {
        User otherUser = new User();
        otherUser.setId(99L);
        post.setUser(otherUser);

        when(userRepository.findByEmail("david@test.com")).thenReturn(Optional.of(user));
        when(postRepository.findById(10L)).thenReturn(Optional.of(post));

        assertThatThrownBy(() -> postService.deletePost(10L))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("your own posts");

        verify(postRepository, never()).delete(any());
    }

    @Test
    @DisplayName("deletePost: lanza ResourceNotFoundException si el post no existe")
    void deletePost_shouldThrow_whenPostNotFound() {
        when(userRepository.findByEmail("david@test.com")).thenReturn(Optional.of(user));
        when(postRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> postService.deletePost(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // ─── CREATE POST WITH IMAGE ───────────────────────────────────────────────

    @Test
    @DisplayName("createPost (multipart): crea post con imagen exitosamente")
    void createPostMultipart_shouldCreateWithImage_whenAuthenticated() {
        MockMultipartFile imageFile = new MockMultipartFile(
                "image", "pic.jpg", "image/jpeg", "image bytes".getBytes());

        when(userRepository.findByEmail("david@test.com")).thenReturn(Optional.of(user));
        when(cloudinaryService.uploadImage(any(), eq("posts"))).thenReturn("http://cloudinary.com/pic.jpg");
        when(postRepository.save(any(Post.class))).thenAnswer(invocation -> {
            Post p = invocation.getArgument(0);
            p.setId(10L);
            return p;
        });
        when(postMapper.toResponse(any(Post.class))).thenReturn(postResponse);

        PostResponse result = postService.createPost("My content", imageFile);

        assertThat(result).isEqualTo(postResponse);
        verify(cloudinaryService).uploadImage(any(), eq("posts"));
        verify(postRepository).save(any(Post.class));
    }

    @Test
    @DisplayName("createPost (multipart): crea post sin imagen exitosamente")
    void createPostMultipart_shouldCreateWithoutImage_whenAuthenticated() {
        when(userRepository.findByEmail("david@test.com")).thenReturn(Optional.of(user));
        when(postRepository.save(any(Post.class))).thenAnswer(invocation -> {
            Post p = invocation.getArgument(0);
            p.setId(10L);
            return p;
        });
        when(postMapper.toResponse(any(Post.class))).thenReturn(postResponse);

        PostResponse result = postService.createPost("My content without image", null);

        assertThat(result).isEqualTo(postResponse);
        verifyNoInteractions(cloudinaryService);
        verify(postRepository).save(any(Post.class));
    }

    @Test
    @DisplayName("createPost (multipart): lanza excepción si no está autenticado")
    void createPostMultipart_shouldThrow_whenNotAuthenticated() {
        SecurityContextHolder.clearContext();

        try (MockedStatic<SecurityUtils> utils = mockStatic(SecurityUtils.class)) {
            utils.when(SecurityUtils::getCurrentUserEmail).thenReturn(null);

            assertThatThrownBy(() -> postService.createPost("Content", null))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage("No autorizado");
        }
    }

    @Test
    @DisplayName("createPost (multipart): lanza excepción si el usuario no existe")
    void createPostMultipart_shouldThrow_whenUserNotFound() {
        when(userRepository.findByEmail("david@test.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> postService.createPost("Content", null))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Usuario no encontrado");
    }

    // ─── EXPLORE / FEED ADDITIONAL ─────────────────────────────────────────────

    @Test
    @DisplayName("explorePosts: retorna posts para usuario anónimo")
    void explorePosts_shouldReturnAllPosts_whenAnonymous() {
        SecurityContextHolder.clearContext();
        try (MockedStatic<SecurityUtils> utils = mockStatic(SecurityUtils.class)) {
            utils.when(SecurityUtils::getCurrentUserEmail).thenReturn(null);

            when(postRepository.findAllByOrderByCreatedAtDesc()).thenReturn(List.of(post));
            when(postMapper.toResponse(post)).thenReturn(postResponse);

            List<PostResponse> result = postService.explorePosts();

            assertThat(result).hasSize(1);
            verifyNoInteractions(likeRepository);
        }
    }

    // ─── GET POST BY ID ADDITIONAL ────────────────────────────────────────────

    @Test
    @DisplayName("getPostById: retorna post para usuario anónimo sin chequear likes")
    void getPostById_shouldReturnPost_whenAnonymous() {
        SecurityContextHolder.clearContext();
        try (MockedStatic<SecurityUtils> utils = mockStatic(SecurityUtils.class)) {
            utils.when(SecurityUtils::getCurrentUserEmail).thenReturn(null);

            when(postRepository.findById(10L)).thenReturn(Optional.of(post));
            when(postMapper.toResponse(post)).thenReturn(postResponse);

            PostResponse result = postService.getPostById(10L);

            assertThat(result).isEqualTo(postResponse);
            verifyNoInteractions(userRepository);
            verifyNoInteractions(likeRepository);
        }
    }

    @Test
    @DisplayName("getPostById: retorna post cuando el usuario autenticado no existe en bd")
    void getPostById_shouldReturnPost_whenUserNotFoundInDb() {
        when(userRepository.findByEmail("david@test.com")).thenReturn(Optional.empty());
        when(postRepository.findById(10L)).thenReturn(Optional.of(post));
        when(postMapper.toResponse(post)).thenReturn(postResponse);

        PostResponse result = postService.getPostById(10L);

        assertThat(result).isEqualTo(postResponse);
        verifyNoInteractions(likeRepository);
    }

    @Test
    @DisplayName("getPostById: marca post como gustado si existe like del usuario")
    void getPostById_shouldMarkAsLiked_whenLikeExists() {
        when(userRepository.findByEmail("david@test.com")).thenReturn(Optional.of(user));
        when(postRepository.findById(10L)).thenReturn(Optional.of(post));
        when(postMapper.toResponse(post)).thenReturn(postResponse);
        when(likeRepository.findByPostIdAndUserId(10L, 1L)).thenReturn(Optional.of(new Like()));

        PostResponse result = postService.getPostById(10L);

        assertThat(result).isEqualTo(postResponse);
        assertThat(postResponse.isLiked()).isTrue();
    }

    // ─── CREATE POST (DTO) ADDITIONAL ──────────────────────────────────────────

    @Test
    @DisplayName("createPost: lanza excepción si el usuario autenticado no existe")
    void createPost_shouldThrow_whenUserNotFound() {
        when(userRepository.findByEmail("david@test.com")).thenReturn(Optional.empty());
        PostRequest request = new PostRequest();

        assertThatThrownBy(() -> postService.createPost(request))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // ─── DELETE POST ADDITIONAL ────────────────────────────────────────────────

    @Test
    @DisplayName("deletePost: lanza excepción si no está autenticado")
    void deletePost_shouldThrow_whenNotAuthenticated() {
        SecurityContextHolder.clearContext();
        try (MockedStatic<SecurityUtils> utils = mockStatic(SecurityUtils.class)) {
            utils.when(SecurityUtils::getCurrentUserEmail).thenReturn(null);

            assertThatThrownBy(() -> postService.deletePost(10L))
                    .isInstanceOf(IllegalArgumentException.class);
        }
    }

    @Test
    @DisplayName("deletePost: lanza excepción si el usuario no existe en bd")
    void deletePost_shouldThrow_whenUserNotFound() {
        when(userRepository.findByEmail("david@test.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> postService.deletePost(10L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("updatePost: actualiza post exitosamente con nueva imagen")
    void updatePost_shouldUpdate_whenPostBelongsToUser() {
        MockMultipartFile imageFile = new MockMultipartFile(
                "image", "new.jpg", "image/jpeg", "new bytes".getBytes());

        when(userRepository.findByEmail("david@test.com")).thenReturn(Optional.of(user));
        when(postRepository.findById(10L)).thenReturn(Optional.of(post));
        when(cloudinaryService.uploadImage(any(), eq("posts"))).thenReturn("http://cloudinary.com/new.jpg");
        when(postRepository.save(any(Post.class))).thenReturn(post);
        when(postMapper.toResponse(any(Post.class))).thenReturn(postResponse);

        PostResponse result = postService.updatePost(10L, "Updated content", imageFile, false);

        assertThat(result).isEqualTo(postResponse);
        verify(cloudinaryService).uploadImage(any(), eq("posts"));
        verify(postRepository).save(any(Post.class));
    }

    @Test
    @DisplayName("updatePost: elimina imagen cuando removeImage es true")
    void updatePost_shouldRemoveImage_whenFlagIsTrue() {
        when(userRepository.findByEmail("david@test.com")).thenReturn(Optional.of(user));
        when(postRepository.findById(10L)).thenReturn(Optional.of(post));
        when(postRepository.save(any(Post.class))).thenReturn(post);
        when(postMapper.toResponse(any(Post.class))).thenReturn(postResponse);

        PostResponse result = postService.updatePost(10L, "Updated", null, true);

        assertThat(result).isEqualTo(postResponse);
        verifyNoInteractions(cloudinaryService);
    }
}

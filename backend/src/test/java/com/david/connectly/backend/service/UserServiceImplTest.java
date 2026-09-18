package com.david.connectly.backend.service;

import com.david.connectly.backend.dto.request.UpdateProfileRequest;
import com.david.connectly.backend.dto.response.PostResponse;
import com.david.connectly.backend.dto.response.UserResponse;
import com.david.connectly.backend.entity.Follow;
import com.david.connectly.backend.entity.Post;
import com.david.connectly.backend.entity.User;
import com.david.connectly.backend.exception.ConflictException;
import com.david.connectly.backend.exception.ResourceNotFoundException;
import com.david.connectly.backend.mapper.PostMapper;
import com.david.connectly.backend.mapper.UserMapper;
import com.david.connectly.backend.repository.FollowRepository;
import com.david.connectly.backend.repository.PostRepository;
import com.david.connectly.backend.repository.UserRepository;
import com.david.connectly.backend.repository.LikeRepository;
import com.david.connectly.backend.entity.Like;
import com.david.connectly.backend.service.impl.UserServiceImpl;
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
@DisplayName("UserServiceImpl - Pruebas unitarias")
class UserServiceImplTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private PostRepository postRepository;
    @Mock
    private FollowRepository followRepository;
    @Mock
    private UserMapper userMapper;
    @Mock
    private PostMapper postMapper;
    @Mock
    private CloudinaryService cloudinaryService;
    @Mock
    private LikeRepository likeRepository;

    @InjectMocks
    private UserServiceImpl userService;

    private User user;
    private UserResponse userResponse;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(1L);
        user.setEmail("david@test.com");
        user.setUsername("david");

        userResponse = new UserResponse();

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("david@test.com", null, List.of()));
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    // ─── GET USER PROFILE ─────────────────────────────────────────────────────

    @Test
    @DisplayName("getUserProfile: retorna perfil cuando el usuario existe")
    void getUserProfile_shouldReturnProfile_whenUserExists() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userMapper.toResponse(user)).thenReturn(userResponse);

        UserResponse result = userService.getUserProfile(1L);

        assertThat(result).isEqualTo(userResponse);
    }

    @Test
    @DisplayName("getUserProfile: lanza ResourceNotFoundException cuando no existe")
    void getUserProfile_shouldThrow_whenUserNotFound() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.getUserProfile(99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("99");
    }

    // ─── GET USER POSTS ───────────────────────────────────────────────────────

    @Test
    @DisplayName("getUserPosts: retorna lista de posts del usuario")
    void getUserPosts_shouldReturnPosts_whenUserExists() {
        Post post = new Post();
        PostResponse postResponse = new PostResponse();

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(postRepository.findAllByUserIdOrderByCreatedAtDesc(1L)).thenReturn(List.of(post));
        when(postMapper.toResponse(post)).thenReturn(postResponse);

        List<PostResponse> result = userService.getUserPosts(1L);

        assertThat(result).hasSize(1).contains(postResponse);
    }

    @Test
    @DisplayName("getUserPosts: lanza ResourceNotFoundException si el usuario no existe")
    void getUserPosts_shouldThrow_whenUserNotFound() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.getUserPosts(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // ─── GET FOLLOWERS / FOLLOWING ────────────────────────────────────────────

    @Test
    @DisplayName("getUserFollowers: retorna lista de seguidores")
    void getUserFollowers_shouldReturnFollowers() {
        User follower = new User();
        follower.setId(2L);
        Follow follow = new Follow();
        follow.setFollower(follower);

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(followRepository.findAllByFollowingId(1L)).thenReturn(List.of(follow));
        when(userMapper.toResponse(follower)).thenReturn(userResponse);

        List<UserResponse> result = userService.getUserFollowers(1L);

        assertThat(result).hasSize(1);
    }

    @Test
    @DisplayName("getUserFollowing: retorna lista de usuarios seguidos")
    void getUserFollowing_shouldReturnFollowing() {
        User following = new User();
        following.setId(3L);
        Follow follow = new Follow();
        follow.setFollowing(following);

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(followRepository.findAllByFollowerId(1L)).thenReturn(List.of(follow));
        when(userMapper.toResponse(following)).thenReturn(userResponse);

        List<UserResponse> result = userService.getUserFollowing(1L);

        assertThat(result).hasSize(1);
    }

    // ─── UPDATE PROFILE ───────────────────────────────────────────────────────

    @Test
    @DisplayName("updateProfile: actualiza el perfil del usuario autenticado")
    void updateProfile_shouldUpdate_whenUserIsOwner() {
        UpdateProfileRequest request = new UpdateProfileRequest();
        request.setUsername("david_nuevo");
        request.setBio("Nueva bio");

        when(userRepository.findByEmail("david@test.com")).thenReturn(Optional.of(user));
        when(userRepository.findByUsername("david_nuevo")).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenReturn(user);
        when(userMapper.toResponse(user)).thenReturn(userResponse);

        UserResponse result = userService.updateProfile(1L, request);

        assertThat(result).isEqualTo(userResponse);
        assertThat(user.getUsername()).isEqualTo("david_nuevo");
        assertThat(user.getBio()).isEqualTo("Nueva bio");
        verify(userRepository).save(user);
    }

    @Test
    @DisplayName("updateProfile: lanza ConflictException si intenta actualizar otro perfil")
    void updateProfile_shouldThrow_whenUpdatingOtherProfile() {
        when(userRepository.findByEmail("david@test.com")).thenReturn(Optional.of(user));

        UpdateProfileRequest request = new UpdateProfileRequest();

        assertThatThrownBy(() -> userService.updateProfile(99L, request))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("your own profile");
    }

    @Test
    @DisplayName("updateProfile: lanza ConflictException si el nuevo username ya está tomado")
    void updateProfile_shouldThrow_whenUsernameAlreadyTaken() {
        User otherUser = new User();
        otherUser.setId(2L);
        otherUser.setUsername("otro");

        UpdateProfileRequest request = new UpdateProfileRequest();
        request.setUsername("otro");

        when(userRepository.findByEmail("david@test.com")).thenReturn(Optional.of(user));
        when(userRepository.findByUsername("otro")).thenReturn(Optional.of(otherUser));

        assertThatThrownBy(() -> userService.updateProfile(1L, request))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("already taken");
    }

    // ─── GET FOLLOWERS / FOLLOWING ERRORS ──────────────────────────────────────

    @Test
    @DisplayName("getUserFollowers: lanza ResourceNotFoundException si el usuario no existe")
    void getUserFollowers_shouldThrow_whenUserNotFound() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.getUserFollowers(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("getUserFollowing: lanza ResourceNotFoundException si el usuario no existe")
    void getUserFollowing_shouldThrow_whenUserNotFound() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.getUserFollowing(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // ─── UPDATE PROFILE ADDITIONAL ─────────────────────────────────────────────

    @Test
    @DisplayName("updateProfile: lanza IllegalArgumentException si no está autenticado")
    void updateProfile_shouldThrow_whenUnauthorized() {
        SecurityContextHolder.clearContext();
        UpdateProfileRequest request = new UpdateProfileRequest();

        assertThatThrownBy(() -> userService.updateProfile(1L, request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Unauthorized");
    }

    @Test
    @DisplayName("updateProfile: lanza ResourceNotFoundException si el usuario autenticado no existe en bd")
    void updateProfile_shouldThrow_whenAuthenticatedUserNotFound() {
        when(userRepository.findByEmail("david@test.com")).thenReturn(Optional.empty());
        UpdateProfileRequest request = new UpdateProfileRequest();

        assertThatThrownBy(() -> userService.updateProfile(1L, request))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("updateProfile: actualiza solo campos no nulos ni vacíos")
    void updateProfile_shouldUpdateOnlyNonNullFields() {
        UpdateProfileRequest request = new UpdateProfileRequest();
        request.setUsername(""); // vacío, no debe actualizarse
        request.setBio("Nueva bio");
        request.setAvatarUrl("http://nuevo.avatar");

        when(userRepository.findByEmail("david@test.com")).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenReturn(user);
        when(userMapper.toResponse(user)).thenReturn(userResponse);

        UserResponse result = userService.updateProfile(1L, request);

        assertThat(result).isEqualTo(userResponse);
        assertThat(user.getUsername()).isEqualTo("david"); // mantiene el original
        assertThat(user.getBio()).isEqualTo("Nueva bio");
        assertThat(user.getAvatarUrl()).isEqualTo("http://nuevo.avatar");
    }

    // ─── UPLOAD AVATAR ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("uploadAvatar: sube avatar exitosamente")
    void uploadAvatar_shouldUploadAndSave_whenValid() {
        org.springframework.web.multipart.MultipartFile mockFile = mock(
                org.springframework.web.multipart.MultipartFile.class);
        when(mockFile.isEmpty()).thenReturn(false);
        when(cloudinaryService.uploadImage(mockFile, "avatars")).thenReturn("http://cloudinary/avatar.jpg");

        when(userRepository.findByEmail("david@test.com")).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenReturn(user);
        when(userMapper.toResponse(user)).thenReturn(userResponse);

        UserResponse result = userService.uploadAvatar(1L, mockFile);

        assertThat(result).isEqualTo(userResponse);
        assertThat(user.getAvatarUrl()).isEqualTo("http://cloudinary/avatar.jpg");
    }

    @Test
    @DisplayName("uploadAvatar: lanza IllegalArgumentException si no está autenticado")
    void uploadAvatar_shouldThrow_whenUnauthorized() {
        SecurityContextHolder.clearContext();
        org.springframework.web.multipart.MultipartFile mockFile = mock(
                org.springframework.web.multipart.MultipartFile.class);

        assertThatThrownBy(() -> userService.uploadAvatar(1L, mockFile))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("uploadAvatar: lanza ResourceNotFoundException si el usuario autenticado no existe en bd")
    void uploadAvatar_shouldThrow_whenUserNotFound() {
        when(userRepository.findByEmail("david@test.com")).thenReturn(Optional.empty());
        org.springframework.web.multipart.MultipartFile mockFile = mock(
                org.springframework.web.multipart.MultipartFile.class);

        assertThatThrownBy(() -> userService.uploadAvatar(1L, mockFile))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("uploadAvatar: lanza ConflictException si actualiza avatar de otro usuario")
    void uploadAvatar_shouldThrow_whenUpdatingOtherAvatar() {
        when(userRepository.findByEmail("david@test.com")).thenReturn(Optional.of(user));
        org.springframework.web.multipart.MultipartFile mockFile = mock(
                org.springframework.web.multipart.MultipartFile.class);

        assertThatThrownBy(() -> userService.uploadAvatar(99L, mockFile))
                .isInstanceOf(ConflictException.class);
    }

    @Test
    @DisplayName("uploadAvatar: lanza IllegalArgumentException si el archivo es nulo o vacío")
    void uploadAvatar_shouldThrow_whenFileEmptyOrNull() {
        when(userRepository.findByEmail("david@test.com")).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> userService.uploadAvatar(1L, null))
                .isInstanceOf(IllegalArgumentException.class);

        org.springframework.web.multipart.MultipartFile mockFile = mock(
                org.springframework.web.multipart.MultipartFile.class);
        when(mockFile.isEmpty()).thenReturn(true);

        assertThatThrownBy(() -> userService.uploadAvatar(1L, mockFile))
                .isInstanceOf(IllegalArgumentException.class);
    }

    // ─── GET ALL USERS ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("getAllUsers: retorna lista de todos los usuarios")
    void getAllUsers_shouldReturnAllUsers() {
        when(userRepository.findAll()).thenReturn(List.of(user));
        when(userMapper.toResponse(user)).thenReturn(userResponse);

        List<UserResponse> result = userService.getAllUsers();

        assertThat(result).hasSize(1).contains(userResponse);
    }

    // ─── GET USER POSTS ADDITIONAL ─────────────────────────────────────────────

    @Test
    @DisplayName("getUserPosts: retorna posts para usuario anónimo")
    void getUserPosts_shouldReturnPosts_whenAnonymous() {
        SecurityContextHolder.clearContext();
        Post post = new Post();
        post.setId(10L);
        PostResponse postResponse = new PostResponse();

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(postRepository.findAllByUserIdOrderByCreatedAtDesc(1L)).thenReturn(List.of(post));
        when(postMapper.toResponse(post)).thenReturn(postResponse);

        List<PostResponse> result = userService.getUserPosts(1L);

        assertThat(result).hasSize(1);
        verifyNoInteractions(likeRepository);
    }

    @Test
    @DisplayName("getUserPosts: retorna posts cuando el usuario autenticado no existe en bd")
    void getUserPosts_shouldReturnPosts_whenAuthenticatedUserNotFoundInDb() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.findByEmail("david@test.com")).thenReturn(Optional.empty());
        Post post = new Post();
        post.setId(10L);
        PostResponse postResponse = new PostResponse();

        when(postRepository.findAllByUserIdOrderByCreatedAtDesc(1L)).thenReturn(List.of(post));
        when(postMapper.toResponse(post)).thenReturn(postResponse);

        List<PostResponse> result = userService.getUserPosts(1L);

        assertThat(result).hasSize(1);
        verifyNoInteractions(likeRepository);
    }

    @Test
    @DisplayName("getUserPosts: marca post como gustado si existe like del usuario")
    void getUserPosts_shouldMarkAsLiked_whenLikeExists() {
        Post post = new Post();
        post.setId(10L);
        PostResponse postResponse = new PostResponse();

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.findByEmail("david@test.com")).thenReturn(Optional.of(user));
        when(postRepository.findAllByUserIdOrderByCreatedAtDesc(1L)).thenReturn(List.of(post));
        when(postMapper.toResponse(post)).thenReturn(postResponse);
        when(likeRepository.findByPostIdAndUserId(10L, 1L)).thenReturn(Optional.of(new Like()));

        List<PostResponse> result = userService.getUserPosts(1L);

        assertThat(result).hasSize(1);
        assertThat(postResponse.isLiked()).isTrue();
    }
}

package com.david.connectly.backend.controller;

import com.david.connectly.backend.dto.request.UpdateProfileRequest;
import com.david.connectly.backend.dto.response.PostResponse;
import com.david.connectly.backend.dto.response.UserResponse;
import com.david.connectly.backend.service.UserService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
@DisplayName("UserController - Pruebas unitarias")
class UserControllerTest {

    private MockMvc mockMvc;

    @Mock
    private UserService userService;

    @InjectMocks
    private UserController userController;

    private ObjectMapper objectMapper;
    private UserResponse userResponse;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(userController).build();
        objectMapper = new ObjectMapper();

        userResponse = new UserResponse();
        userResponse.setId(1L);
        userResponse.setUsername("testuser");
        userResponse.setEmail("test@test.com");
    }

    @Test
    @DisplayName("getUserProfile: retorna perfil de usuario")
    void getUserProfile_shouldReturnUser() throws Exception {
        when(userService.getUserProfile(1L)).thenReturn(userResponse);

        mockMvc.perform(get("/api/users/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.username").value("testuser"));
    }

    @Test
    @DisplayName("getUserPosts: retorna publicaciones del usuario")
    void getUserPosts_shouldReturnPosts() throws Exception {
        PostResponse post = new PostResponse();
        post.setId(10L);
        post.setContent("Hello World");
        when(userService.getUserPosts(1L)).thenReturn(List.of(post));

        mockMvc.perform(get("/api/users/1/posts"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(10))
                .andExpect(jsonPath("$[0].content").value("Hello World"));
    }

    @Test
    @DisplayName("getUserFollowers: retorna seguidores")
    void getUserFollowers_shouldReturnFollowers() throws Exception {
        when(userService.getUserFollowers(1L)).thenReturn(List.of(userResponse));

        mockMvc.perform(get("/api/users/1/followers"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].username").value("testuser"));
    }

    @Test
    @DisplayName("getUserFollowing: retorna seguidos")
    void getUserFollowing_shouldReturnFollowing() throws Exception {
        when(userService.getUserFollowing(1L)).thenReturn(List.of(userResponse));

        mockMvc.perform(get("/api/users/1/following"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].username").value("testuser"));
    }

    @Test
    @DisplayName("updateProfile: actualiza perfil y retorna el nuevo estado")
    void updateProfile_shouldReturnUpdatedUser() throws Exception {
        UpdateProfileRequest request = new UpdateProfileRequest();
        request.setBio("My new bio");

        when(userService.updateProfile(eq(1L), any(UpdateProfileRequest.class))).thenReturn(userResponse);

        mockMvc.perform(put("/api/users/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    @DisplayName("uploadAvatar: sube avatar y retorna usuario actualizado")
    void uploadAvatar_shouldReturnUpdatedUser() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "avatar.jpg",
                MediaType.IMAGE_JPEG_VALUE,
                "avatar-content".getBytes()
        );

        when(userService.uploadAvatar(eq(1L), any())).thenReturn(userResponse);

        mockMvc.perform(multipart("/api/users/1/avatar").file(file).with(request -> {
            request.setMethod("PUT");
            return request;
        }))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    @DisplayName("getAllUsers: retorna todos los usuarios")
    void getAllUsers_shouldReturnUsers() throws Exception {
        when(userService.getAllUsers()).thenReturn(List.of(userResponse));

        mockMvc.perform(get("/api/users"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1));
    }
}

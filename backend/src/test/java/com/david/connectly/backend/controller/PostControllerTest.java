package com.david.connectly.backend.controller;

import com.david.connectly.backend.dto.request.PostRequest;
import com.david.connectly.backend.dto.response.PostResponse;
import com.david.connectly.backend.service.PostService;
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
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
@DisplayName("PostController - Pruebas unitarias")
class PostControllerTest {

    private MockMvc mockMvc;

    @Mock
    private PostService postService;

    @InjectMocks
    private PostController postController;

    private ObjectMapper objectMapper;
    private PostResponse postResponse;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(postController).build();
        objectMapper = new ObjectMapper();

        postResponse = new PostResponse();
        postResponse.setId(1L);
        postResponse.setContent("Test Content");
    }

    @Test
    @DisplayName("getFeed: retorna listado de posts del feed")
    void getFeed_shouldReturnPosts() throws Exception {
        when(postService.getFeed()).thenReturn(List.of(postResponse));

        mockMvc.perform(get("/api/posts/feed"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].content").value("Test Content"));
    }

    @Test
    @DisplayName("explorePosts: retorna listado de posts para explorar")
    void explorePosts_shouldReturnPosts() throws Exception {
        when(postService.explorePosts()).thenReturn(List.of(postResponse));

        mockMvc.perform(get("/api/posts/explore"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].content").value("Test Content"));
    }

    @Test
    @DisplayName("getPost: retorna post por id")
    void getPost_shouldReturnPost() throws Exception {
        when(postService.getPostById(1L)).thenReturn(postResponse);

        mockMvc.perform(get("/api/posts/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.content").value("Test Content"));
    }

    @Test
    @DisplayName("createPost: crea un post y retorna 201")
    void createPost_shouldReturnCreated() throws Exception {
        PostRequest request = new PostRequest();
        request.setContent("Test Content");

        when(postService.createPost(any(PostRequest.class))).thenReturn(postResponse);

        mockMvc.perform(post("/api/posts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.content").value("Test Content"));
    }

    @Test
    @DisplayName("createPostWithImage: crea un post con imagen y retorna 201")
    void createPostWithImage_shouldReturnCreated() throws Exception {
        MockMultipartFile imageFile = new MockMultipartFile(
                "image",
                "image.jpg",
                MediaType.IMAGE_JPEG_VALUE,
                "some-image-bytes".getBytes()
        );

        when(postService.createPost(eq("Content with image"), any())).thenReturn(postResponse);

        mockMvc.perform(multipart("/api/posts/upload")
                        .file(imageFile)
                        .param("content", "Content with image"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    @DisplayName("deletePost y updatePost: elimina y actualiza posts correctamente")
    void deleteAndUpdatePost_shouldWork() throws Exception {
        // Test DELETE
        doNothing().when(postService).deletePost(1L);
        mockMvc.perform(delete("/api/posts/1"))
                .andExpect(status().isNoContent());

        // Test PUT (updatePost)
        MockMultipartFile updateImage = new MockMultipartFile(
                "image", "updated.jpg", MediaType.IMAGE_JPEG_VALUE, "updated-bytes".getBytes());

        when(postService.updatePost(eq(1L), eq("Updated content"), any(), eq(false))).thenReturn(postResponse);

        mockMvc.perform(multipart("/api/posts/1")
                        .file(updateImage)
                        .param("content", "Updated content")
                        .param("removeImage", "false")
                        .with(request -> {
                            request.setMethod("PUT");
                            return request;
                        }))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1));
    }
}

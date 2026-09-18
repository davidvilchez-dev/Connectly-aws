package com.david.connectly.backend.controller;

import com.david.connectly.backend.service.LikeService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
@DisplayName("LikeController - Pruebas unitarias")
class LikeControllerTest {

    private MockMvc mockMvc;

    @Mock
    private LikeService likeService;

    @InjectMocks
    private LikeController likeController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(likeController).build();
    }

    @Test
    @DisplayName("likePost: da like a un post y retorna 201")
    void likePost_shouldReturnCreated() throws Exception {
        doNothing().when(likeService).likePost(10L);

        mockMvc.perform(post("/api/posts/10/likes"))
                .andExpect(status().isCreated());
    }

    @Test
    @DisplayName("unlikePost: quita like de un post y retorna 204")
    void unlikePost_shouldReturnNoContent() throws Exception {
        doNothing().when(likeService).unlikePost(10L);

        mockMvc.perform(delete("/api/posts/10/likes"))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("getLikesCount: retorna la cantidad de likes de un post")
    void getLikesCount_shouldReturnCount() throws Exception {
        when(likeService.getLikesCount(10L)).thenReturn(42L);

        mockMvc.perform(get("/api/posts/10/likes/count"))
                .andExpect(status().isOk())
                .andExpect(content().string("42"));
    }
}

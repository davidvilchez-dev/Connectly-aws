package com.david.connectly.backend.controller;

import com.david.connectly.backend.service.FollowService;
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
@DisplayName("FollowController - Pruebas unitarias")
class FollowControllerTest {

    private MockMvc mockMvc;

    @Mock
    private FollowService followService;

    @InjectMocks
    private FollowController followController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(followController).build();
    }

    @Test
    @DisplayName("followUser: sigue a un usuario y retorna 201")
    void followUser_shouldReturnCreated() throws Exception {
        doNothing().when(followService).followUser(5L);

        mockMvc.perform(post("/api/follows/5"))
                .andExpect(status().isCreated());
    }

    @Test
    @DisplayName("unfollowUser: deja de seguir a un usuario y retorna 204")
    void unfollowUser_shouldReturnNoContent() throws Exception {
        doNothing().when(followService).unfollowUser(5L);

        mockMvc.perform(delete("/api/follows/5"))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("checkFollowStatus: retorna si el usuario actual sigue a otro usuario")
    void checkFollowStatus_shouldReturnBoolean() throws Exception {
        when(followService.isFollowing(5L)).thenReturn(true);

        mockMvc.perform(get("/api/follows/5/status"))
                .andExpect(status().isOk())
                .andExpect(content().string("true"));
    }
}

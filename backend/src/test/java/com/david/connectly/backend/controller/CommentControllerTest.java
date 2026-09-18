package com.david.connectly.backend.controller;

import com.david.connectly.backend.dto.request.CommentRequest;
import com.david.connectly.backend.dto.response.CommentResponse;
import com.david.connectly.backend.service.CommentService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
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
@DisplayName("CommentController - Pruebas unitarias")
class CommentControllerTest {

    private MockMvc mockMvc;

    @Mock
    private CommentService commentService;

    @InjectMocks
    private CommentController commentController;

    private ObjectMapper objectMapper;
    private CommentResponse commentResponse;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(commentController).build();
        objectMapper = new ObjectMapper();

        commentResponse = new CommentResponse();
        commentResponse.setId(1L);
        commentResponse.setContent("Test Comment");
    }

    @Test
    @DisplayName("getComments: retorna comentarios de un post")
    void getComments_shouldReturnCommentsList() throws Exception {
        when(commentService.getCommentsByPostId(10L)).thenReturn(List.of(commentResponse));

        mockMvc.perform(get("/api/posts/10/comments"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].content").value("Test Comment"));
    }

    @Test
    @DisplayName("addComment: agrega un comentario a un post y retorna 201")
    void addComment_shouldReturnCreated() throws Exception {
        CommentRequest request = new CommentRequest();
        request.setContent("Test Comment");
        request.setPostId(10L);

        when(commentService.addComment(eq(10L), any(CommentRequest.class))).thenReturn(commentResponse);

        mockMvc.perform(post("/api/posts/10/comments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.content").value("Test Comment"));
    }

    @Test
    @DisplayName("deleteComment y updateComment: elimina y actualiza comentarios correctamente")
    void deleteAndUpdateComment_shouldWork() throws Exception {
        // Test DELETE
        doNothing().when(commentService).deleteComment(1L);
        mockMvc.perform(delete("/api/comments/1"))
                .andExpect(status().isNoContent());

        // Test PUT (updateComment)
        CommentRequest updateRequest = new CommentRequest();
        updateRequest.setContent("Updated Comment");
        updateRequest.setPostId(1L);
        CommentResponse updatedResponse = new CommentResponse();
        updatedResponse.setId(1L);
        updatedResponse.setContent("Updated Comment");

        when(commentService.updateComment(eq(1L), any(CommentRequest.class))).thenReturn(updatedResponse);

        mockMvc.perform(put("/api/comments/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.content").value("Updated Comment"));
    }
}

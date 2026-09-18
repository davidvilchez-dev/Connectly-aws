package com.david.connectly.backend.service;

import com.david.connectly.backend.dto.request.CommentRequest;
import com.david.connectly.backend.dto.response.CommentResponse;

import java.util.List;

public interface CommentService {
    List<CommentResponse> getCommentsByPostId(Long postId);

    CommentResponse addComment(Long postId, CommentRequest request);

    void deleteComment(Long id);

    CommentResponse updateComment(Long id, CommentRequest request);
}

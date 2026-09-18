package com.david.connectly.backend.service;

public interface LikeService {
    void likePost(Long postId);

    void unlikePost(Long postId);

    Long getLikesCount(Long postId);
}

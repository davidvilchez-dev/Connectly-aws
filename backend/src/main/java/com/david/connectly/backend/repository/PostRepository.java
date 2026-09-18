package com.david.connectly.backend.repository;

import com.david.connectly.backend.entity.Post;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PostRepository extends JpaRepository<Post, Long> {
    List<Post> findAllByUserIdOrderByCreatedAtDesc(Long userId);

    List<Post> findAllByOrderByCreatedAtDesc();
}

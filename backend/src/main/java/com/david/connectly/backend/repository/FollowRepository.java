package com.david.connectly.backend.repository;

import com.david.connectly.backend.entity.Follow;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FollowRepository extends JpaRepository<Follow, Long> {
    Optional<Follow> findByFollowerIdAndFollowingId(Long followerId, Long followingId);

    List<Follow> findAllByFollowingId(Long userId);

    List<Follow> findAllByFollowerId(Long userId);
}

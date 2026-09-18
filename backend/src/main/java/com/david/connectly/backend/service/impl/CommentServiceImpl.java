package com.david.connectly.backend.service.impl;

import com.david.connectly.backend.dto.request.CommentRequest;
import com.david.connectly.backend.dto.response.CommentResponse;
import com.david.connectly.backend.entity.Comment;
import com.david.connectly.backend.entity.Post;
import com.david.connectly.backend.entity.User;
import com.david.connectly.backend.exception.ConflictException;
import com.david.connectly.backend.exception.ResourceNotFoundException;
import com.david.connectly.backend.mapper.CommentMapper;
import com.david.connectly.backend.repository.CommentRepository;
import com.david.connectly.backend.repository.PostRepository;
import com.david.connectly.backend.repository.UserRepository;
import com.david.connectly.backend.security.SecurityUtils;
import com.david.connectly.backend.service.CommentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class CommentServiceImpl implements CommentService {
    private final CommentRepository commentRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final CommentMapper commentMapper;

    @Override
    public List<CommentResponse> getCommentsByPostId(Long postId) {
        // 404 si el post no existe
        postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with id: " + postId));

        return commentRepository.findAllByPostIdOrderByCreatedAtAsc(postId)
                .stream()
                .map(commentMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public CommentResponse addComment(Long postId, CommentRequest request) {
        String currentEmail = SecurityUtils.getCurrentUserEmail();
        if (currentEmail == null) {
            throw new IllegalArgumentException("Unauthorized");
        }

        User user = userRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found for authenticated principal"));

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with id: " + postId));

        Comment comment = commentMapper.toEntity(request);
        comment.setUser(user);
        comment.setPost(post);
        comment.setCreatedAt(LocalDateTime.now());
        comment.setUpdatedAt(null);

        Comment saved = commentRepository.save(comment);
        return commentMapper.toResponse(saved);
    }

    @Override
    public void deleteComment(Long id) {
        String currentEmail = SecurityUtils.getCurrentUserEmail();
        if (currentEmail == null) {
            throw new IllegalArgumentException("Unauthorized");
        }

        User user = userRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found for authenticated principal"));

        Comment comment = commentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found with id: " + id));

        if (comment.getUser() == null || comment.getUser().getId() == null
                || !comment.getUser().getId().equals(user.getId())) {
            throw new ConflictException("You can only delete your own comments");
        }

        commentRepository.delete(comment);
    }

    @Override
    public CommentResponse updateComment(Long id, CommentRequest request) {
        String currentEmail = SecurityUtils.getCurrentUserEmail();
        if (currentEmail == null) {
            throw new IllegalArgumentException("No autorizado");
        }

        User user = userRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

        Comment comment = commentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Comentario no encontrado con id: " + id));

        if (comment.getUser() == null || comment.getUser().getId() == null
                || !comment.getUser().getId().equals(user.getId())) {
            throw new ConflictException("Solo puedes editar tus propios comentarios");
        }

        comment.setContent(request.getContent());
        comment.setUpdatedAt(LocalDateTime.now());

        Comment saved = commentRepository.save(comment);
        return commentMapper.toResponse(saved);
    }
}
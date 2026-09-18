package com.david.connectly.backend.mapper;

import com.david.connectly.backend.dto.request.PostRequest;
import com.david.connectly.backend.dto.response.PostResponse;
import com.david.connectly.backend.entity.Post;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", uses = { UserMapper.class }, unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface PostMapper {

    Post toEntity(PostRequest request);

    @Mapping(target = "commentsCount", expression = "java(entity.getComments() != null ? entity.getComments().size() : 0)")
    @Mapping(target = "likesCount", expression = "java(entity.getLikes() != null ? entity.getLikes().size() : 0)")
    PostResponse toResponse(Post entity);
}

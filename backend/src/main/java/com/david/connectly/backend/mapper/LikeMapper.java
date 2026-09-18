package com.david.connectly.backend.mapper;

import com.david.connectly.backend.dto.response.LikeResponse;
import com.david.connectly.backend.entity.Like;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", uses = { UserMapper.class }, unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface LikeMapper {

    @Mapping(target = "postId", source = "post.id")
    LikeResponse toResponse(Like entity);
}

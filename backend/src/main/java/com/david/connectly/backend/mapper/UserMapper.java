package com.david.connectly.backend.mapper;

import com.david.connectly.backend.dto.request.RegisterRequest;
import com.david.connectly.backend.dto.response.UserResponse;
import com.david.connectly.backend.entity.User;
import org.mapstruct.Mapper;

import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface UserMapper {

    User toEntity(RegisterRequest request);

    UserResponse toResponse(User entity);

}

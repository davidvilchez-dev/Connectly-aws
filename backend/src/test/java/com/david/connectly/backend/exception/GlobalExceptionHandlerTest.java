package com.david.connectly.backend.exception;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("GlobalExceptionHandler - Pruebas unitarias")
class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler exceptionHandler;

    @BeforeEach
    void setUp() {
        exceptionHandler = new GlobalExceptionHandler();
    }

    @Test
    @DisplayName("handleResourceNotFoundException: retorna 404")
    void handleResourceNotFoundException_shouldReturnNotFound() {
        ResourceNotFoundException ex = new ResourceNotFoundException("No encontrado");
        ResponseEntity<ErrorResponse> response = exceptionHandler.handleResourceNotFoundException(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getMessage()).isEqualTo("No encontrado");
        assertThat(response.getBody().getErrorDetails()).contains("El recurso solicitado no existe en la base de datos");
    }

    @Test
    @DisplayName("handleValidation: retorna 400 y detalles de campos")
    void handleValidation_shouldReturnBadRequestAndDetails() {
        MethodArgumentNotValidException ex = mock(MethodArgumentNotValidException.class);
        BindingResult bindingResult = mock(BindingResult.class);
        FieldError fieldError = new FieldError("objectName", "fieldName", "must not be null");

        when(ex.getBindingResult()).thenReturn(bindingResult);
        when(bindingResult.getFieldErrors()).thenReturn(List.of(fieldError));

        ResponseEntity<ErrorResponse> response = exceptionHandler.handleValidation(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getMessage()).isEqualTo("Validation failed");
        assertThat(response.getBody().getErrorDetails()).contains("fieldName: must not be null");
    }

    @Test
    @DisplayName("handleIllegalArgument: retorna 400")
    void handleIllegalArgument_shouldReturnBadRequest() {
        IllegalArgumentException ex = new IllegalArgumentException("Argumento inválido");
        ResponseEntity<ErrorResponse> response = exceptionHandler.handleIllegalArgument(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getMessage()).isEqualTo("Argumento inválido");
    }

    @Test
    @DisplayName("handleConflict: retorna 409")
    void handleConflict_shouldReturnConflict() {
        ConflictException ex = new ConflictException("Conflicto");
        ResponseEntity<ErrorResponse> response = exceptionHandler.handleConflict(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getMessage()).isEqualTo("Conflicto");
    }

    @Test
    @DisplayName("handleUsernameNotFound: retorna 401")
    void handleUsernameNotFound_shouldReturnUnauthorized() {
        UsernameNotFoundException ex = new UsernameNotFoundException("Usuario no encontrado");
        ResponseEntity<ErrorResponse> response = exceptionHandler.handleUsernameNotFound(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getMessage()).isEqualTo("Usuario no encontrado");
    }

    @Test
    @DisplayName("handleBadCredentials: retorna 401")
    void handleBadCredentials_shouldReturnUnauthorized() {
        BadCredentialsException ex = new BadCredentialsException("Credenciales inválidas");
        ResponseEntity<ErrorResponse> response = exceptionHandler.handleBadCredentials(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getMessage()).isEqualTo("Credenciales inválidas");
    }

    @Test
    @DisplayName("handleAuthentication: retorna 401")
    void handleAuthentication_shouldReturnUnauthorized() {
        AuthenticationException ex = new AuthenticationException("Fallo auth") {};
        ResponseEntity<ErrorResponse> response = exceptionHandler.handleAuthentication(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getMessage()).isEqualTo("Correo o contraseña inválidos");
    }

    @Test
    @DisplayName("handleAccessDenied: retorna 403")
    void handleAccessDenied_shouldReturnForbidden() {
        AccessDeniedException ex = new AccessDeniedException("Acceso denegado");
        ResponseEntity<ErrorResponse> response = exceptionHandler.handleAccessDenied(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getMessage()).isEqualTo("Forbidden");
    }

    @Test
    @DisplayName("handleMaxUploadSizeExceeded: retorna 400")
    void handleMaxUploadSizeExceeded_shouldReturnBadRequest() {
        MaxUploadSizeExceededException ex = new MaxUploadSizeExceededException(1024L);
        ResponseEntity<ErrorResponse> response = exceptionHandler.handleMaxUploadSizeExceeded(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getMessage()).isEqualTo("La imagen excede el tamaño máximo permitido de 10MB");
    }

    @Test
    @DisplayName("handleGeneric: retorna 500")
    void handleGeneric_shouldReturnInternalServerError() {
        Exception ex = new Exception("Error genérico");
        ResponseEntity<ErrorResponse> response = exceptionHandler.handleGeneric(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getMessage()).contains("Error genérico");
    }
}

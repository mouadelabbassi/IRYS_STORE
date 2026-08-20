package com.dashboard.controller;

import com. dashboard.dto.request.LoginRequest;
import com.dashboard.dto.response.ApiResponse;
import com.dashboard.dto. response.AuthResponse;
import com.dashboard.entity.User;
import com.dashboard.service.AuthService;
import io. swagger.v3. oas.annotations. Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok. RequiredArgsConstructor;
import org.springframework. http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Authentication and user management endpoints")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    @Operation(summary = "Administrator login", description = "Authenticates an administrator and returns a JWT token")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse authResponse = authService. login(request);
        return ResponseEntity. ok(ApiResponse.success("Login successful", authResponse));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh JWT token", description = "Generates a new JWT token")
    public ResponseEntity<ApiResponse<AuthResponse>> refreshToken() {
        AuthResponse authResponse = authService.refreshToken();
        return ResponseEntity.ok(ApiResponse.success("Token refreshed successfully", authResponse));
    }

    @GetMapping("/me")
    @Operation(summary = "Get current user", description = "Returns the currently authenticated user")
    public ResponseEntity<ApiResponse<User>> getCurrentUser() {
        User user = authService.getCurrentUser();
        return ResponseEntity. ok(ApiResponse. success("User retrieved successfully", user));
    }

}

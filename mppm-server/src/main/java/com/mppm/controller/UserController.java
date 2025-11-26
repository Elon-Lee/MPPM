package com.mppm.controller;

import com.mppm.dto.request.ResetPasswordRequest;
import com.mppm.dto.request.UserCreateRequest;
import com.mppm.dto.request.UserUpdateRequest;
import com.mppm.dto.response.ApiResponse;
import com.mppm.dto.response.PageResponse;
import com.mppm.dto.response.RoleResponse;
import com.mppm.dto.response.UserResponse;
import com.mppm.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/v1/users")
@RequiredArgsConstructor
@Tag(name = "用户管理", description = "后台用户管理接口")
public class UserController {

    private final UserService userService;

    @GetMapping
    @Operation(summary = "用户列表")
    public ApiResponse<PageResponse<UserResponse>> list(@RequestParam(defaultValue = "1") int page,
                                                        @RequestParam(defaultValue = "10") int size,
                                                        @RequestParam(required = false) String keyword) {
        return ApiResponse.success(userService.listUsers(page, size, keyword));
    }

    @PostMapping
    @Operation(summary = "创建用户")
    public ApiResponse<UserResponse> create(@Valid @RequestBody UserCreateRequest request) {
        return ApiResponse.success(userService.createUser(request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "更新用户")
    public ApiResponse<UserResponse> update(@PathVariable Long id,
                                            @Valid @RequestBody UserUpdateRequest request) {
        return ApiResponse.success(userService.updateUser(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "删除用户")
    public ApiResponse<Boolean> delete(@PathVariable Long id) {
        userService.deleteUser(id);
        return ApiResponse.success(true);
    }

    @PostMapping("/{id}/reset-password")
    @Operation(summary = "重置密码")
    public ApiResponse<String> resetPassword(@PathVariable Long id,
                                             @Valid @RequestBody(required = false) ResetPasswordRequest request) {
        String newPassword = userService.resetPassword(id, request);
        return ApiResponse.success(newPassword);
    }

    @GetMapping("/roles")
    @Operation(summary = "角色列表")
    public ApiResponse<List<RoleResponse>> roles() {
        return ApiResponse.success(userService.listRoles());
    }
}


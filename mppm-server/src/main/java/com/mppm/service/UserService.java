package com.mppm.service;

import com.mppm.dto.request.ResetPasswordRequest;
import com.mppm.dto.request.UserCreateRequest;
import com.mppm.dto.request.UserUpdateRequest;
import com.mppm.dto.response.PageResponse;
import com.mppm.dto.response.RoleResponse;
import com.mppm.dto.response.UserResponse;
import com.mppm.entity.Role;
import com.mppm.entity.User;
import com.mppm.repository.RoleRepository;
import com.mppm.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public PageResponse<UserResponse> listUsers(int page, int size, String keyword) {
        Pageable pageable = PageRequest.of(Math.max(page - 1, 0), size,
            Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<User> result = userRepository.search(keyword, pageable);

        return PageResponse.<UserResponse>builder()
            .data(result.stream().map(this::toResponse).toList())
            .total(result.getTotalElements())
            .page(page)
            .size(size)
            .build();
    }

    @Transactional
    public UserResponse createUser(UserCreateRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("用户名已存在");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("邮箱已存在");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setStatus(request.getStatus());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));

        Set<Role> roles = resolveRoles(request.getRoles());
        user.setRoles(roles);

        return toResponse(userRepository.save(user));
    }

    @Transactional
    public UserResponse updateUser(Long userId, UserUpdateRequest request) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("用户不存在"));

        if (StringUtils.hasText(request.getEmail()) &&
            !request.getEmail().equals(user.getEmail()) &&
            userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("邮箱已存在");
        }

        user.setEmail(request.getEmail());
        user.setNickname(request.getNickname());
        if (StringUtils.hasText(request.getStatus())) {
            user.setStatus(request.getStatus());
        }

        if (!CollectionUtils.isEmpty(request.getRoles())) {
            user.setRoles(resolveRoles(request.getRoles()));
        }

        return toResponse(userRepository.save(user));
    }

    @Transactional
    public void deleteUser(Long userId) {
        userRepository.deleteById(userId);
    }

    @Transactional
    public String resetPassword(Long userId, ResetPasswordRequest request) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("用户不存在"));

        String newPassword = request != null && StringUtils.hasText(request.getNewPassword())
            ? request.getNewPassword()
            : generateTempPassword();
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        return newPassword;
    }

    public List<RoleResponse> listRoles() {
        return roleRepository.findAll().stream()
            .map(role -> RoleResponse.builder()
                .id(role.getId())
                .code(role.getCode())
                .name(role.getName())
                .description(role.getDescription())
                .build())
            .toList();
    }

    private Set<Role> resolveRoles(Set<String> codes) {
        if (CollectionUtils.isEmpty(codes)) {
            return roleRepository.findByCodeIn(Set.of("OPERATOR"));
        }
        Set<Role> roles = roleRepository.findByCodeIn(codes);
        if (roles.size() != codes.size()) {
            throw new RuntimeException("角色信息不正确");
        }
        return roles;
    }

    private UserResponse toResponse(User user) {
        return UserResponse.builder()
            .id(user.getId())
            .username(user.getUsername())
            .email(user.getEmail())
            .nickname(user.getNickname())
            .status(user.getStatus())
            .roles(user.getRoles().stream()
                .map(Role::getCode)
                .collect(Collectors.toList()))
            .createdAt(user.getCreatedAt())
            .updatedAt(user.getUpdatedAt())
            .build();
    }

    private String generateTempPassword() {
        String base = Long.toHexString(Double.doubleToLongBits(Math.random()));
        return "Tmp" + base.substring(0, Math.min(base.length(), 8));
    }
}


package com.mppm.security;

import lombok.AllArgsConstructor;
import lombok.Data;
import org.springframework.security.core.GrantedAuthority;

import java.util.Collection;

@Data
@AllArgsConstructor
public class UserPrincipal {
    private Long id;
    private String username;
    private Collection<? extends GrantedAuthority> authorities;
}


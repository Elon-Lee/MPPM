-- 预置后台管理员账号
INSERT INTO users (username, email, password_hash, status)
VALUES (
    'admin',
    'admin@example.com',
    '$2a$10$1bS7mQ1eRrQdlqzTeWY5cuMo2P/d9vywgq6Z9eruqbWtaXDpUe1ke', -- 密码: Admin@123
    'ACTIVE'
)
ON CONFLICT (username) DO NOTHING;

-- 绑定管理员角色
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
JOIN roles r ON r.code = 'ADMIN'
WHERE u.username = 'admin'
ON CONFLICT DO NOTHING;


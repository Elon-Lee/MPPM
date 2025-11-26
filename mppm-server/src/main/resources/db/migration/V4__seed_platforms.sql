INSERT INTO platforms (name, display_name, enabled)
VALUES
    ('DOUYIN', '抖音', TRUE),
    ('XIAOHONGSHU', '小红书', TRUE),
    ('ZHIHU', '知乎', TRUE)
ON CONFLICT (name) DO NOTHING;


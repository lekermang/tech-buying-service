-- Сброс всех сессий и паролей — все аккаунты становятся недоступны
UPDATE t_p31606708_tech_buying_service.dzchat_users
SET session_token = NULL,
    session_expires_at = NULL,
    password_hash = NULL,
    otp = NULL,
    otp_expires_at = NULL;

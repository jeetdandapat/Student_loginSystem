CREATE TABLE users (
    user_id VARCHAR(255) PRIMARY KEY,  -- UUID as primary key
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(15),
    registration_number VARCHAR(50),
    password VARCHAR(255) NOT NULL
);

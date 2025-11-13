-- Create Database
CREATE DATABASE IF NOT EXISTS hospital_management;
USE hospital_management;

-- Departments Table
CREATE TABLE departments (
    department_id INT PRIMARY KEY AUTO_INCREMENT,
    department_name VARCHAR(100) NOT NULL,
    department_location VARCHAR(100),
    department_password VARCHAR(50) NOT NULL
);

-- Employees Table
CREATE TABLE employees (
    unique_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email_id VARCHAR(100) NOT NULL,
    contact_number VARCHAR(20),
    department_id INT,
    is_active BOOLEAN DEFAULT TRUE,
    is_on_duty BOOLEAN DEFAULT FALSE,
    date_joined DATE,
    date_left DATE,
    reason_for_leaving TEXT,
    FOREIGN KEY (department_id) REFERENCES departments(department_id)
);

-- Roles Table
CREATE TABLE roles (
    role_id INT PRIMARY KEY AUTO_INCREMENT,
    role_name VARCHAR(100) NOT NULL,
    role_type VARCHAR(50)
);

-- Employee-Role Mapping (Many-to-Many)
CREATE TABLE employee_roles (
    employee_id VARCHAR(50),
    role_id INT,
    PRIMARY KEY (employee_id, role_id),
    FOREIGN KEY (employee_id) REFERENCES employees(unique_id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE CASCADE
);

-- Qualifications Table
CREATE TABLE qualifications (
    qualification_id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id VARCHAR(50),
    degree VARCHAR(100) NOT NULL,
    institution VARCHAR(200),
    year_awarded INT,
    FOREIGN KEY (employee_id) REFERENCES employees(unique_id) ON DELETE CASCADE
);

-- Salary Table
CREATE TABLE salary (
    employee_id VARCHAR(50) PRIMARY KEY,
    base_salary DECIMAL(10, 2),
    bonus DECIMAL(10, 2) DEFAULT 0,
    pay_grade VARCHAR(20),
    FOREIGN KEY (employee_id) REFERENCES employees(unique_id) ON DELETE CASCADE
);

-- Shifts Table
CREATE TABLE shifts (
    shift_id INT PRIMARY KEY AUTO_INCREMENT,
    shift_type ENUM('Day', 'Night') NOT NULL,
    shift_time VARCHAR(50)
);

-- Employee-Shift Mapping
CREATE TABLE employee_shifts (
    employee_id VARCHAR(50),
    shift_id INT,
    PRIMARY KEY (employee_id, shift_id),
    FOREIGN KEY (employee_id) REFERENCES employees(unique_id) ON DELETE CASCADE,
    FOREIGN KEY (shift_id) REFERENCES shifts(shift_id) ON DELETE CASCADE
);

-- Leave Records Table
CREATE TABLE leave_records (
    leave_id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id VARCHAR(50),
    leave_type VARCHAR(50),
    duration INT,
    start_date DATE,
    end_date DATE,
    status ENUM('Approved', 'Pending', 'Rejected') DEFAULT 'Pending',
    FOREIGN KEY (employee_id) REFERENCES employees(unique_id) ON DELETE CASCADE
);

-- Insert Sample Departments with Passwords
INSERT INTO departments (department_name, department_location, department_password) VALUES
('Cardiology', 'Building A, Floor 2', 'cardio123'),
('Radiology', 'Building B, Floor 1', 'radio123'),
('Neurology', 'Building A, Floor 3', 'neuro123'),
('Pediatrics', 'Building C, Floor 2', 'pedia123'),
('Emergency', 'Building A, Ground Floor', 'emergency123');

-- Insert Sample Shifts
INSERT INTO shifts (shift_type, shift_time) VALUES
('Day', '8:00 AM - 4:00 PM'),
('Night', '8:00 PM - 4:00 AM');

-- Insert Sample Roles
INSERT INTO roles (role_name, role_type) VALUES
('Doctor', 'Medical'),
('Nurse', 'Medical'),
('Technician', 'Technical'),
('Administrator', 'Administrative'),
('Surgeon', 'Medical');
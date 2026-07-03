USE [master];
GO

-- Create SQL login
CREATE LOGIN [biblioteca_user] WITH PASSWORD = N'Bibli0teca2024!';
GO

-- Grant permission to connect to SQL Server
GRANT CONNECT SQL TO [biblioteca_user];
GO

-- Use target database
USE [BibliotecaDB];
GO

-- Create database user for the login
CREATE USER [biblioteca_user] FOR LOGIN [biblioteca_user];
GO

-- Grant db_owner role
EXEC sp_addrolemember N'db_owner', N'biblioteca_user';
GO

SELECT 'LOGIN CREADO' AS resultado;
GO

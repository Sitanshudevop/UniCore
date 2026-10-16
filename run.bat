@echo off
cd /d "%~dp0"
java --add-modules jdk.httpserver src\Server.java
pause

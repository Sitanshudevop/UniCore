# Lightweight Alpine Linux with OpenJDK 17
FROM eclipse-temurin:17-jdk-alpine

WORKDIR /app

# Copy project source and documentation
COPY . .

# Set default port (Render will override via PORT env var)
ENV PORT=8000
EXPOSE 8000

# Run native Java HTTP server
CMD ["java", "--add-modules", "jdk.httpserver", "src/Server.java"]

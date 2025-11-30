FROM eclipse-temurin:25-jdk-alpine AS build
WORKDIR /app

COPY .mvn/ .mvn
COPY mvnw pom.xml ./

RUN chmod +x mvnw

# Tải dependency (nếu mạng chậm bước này có thể lâu)
RUN ./mvnw dependency:go-offline

# Copy source code và build
COPY src ./src
RUN ./mvnw clean package -DskipTests

#Chạy ứng dụng
FROM eclipse-temurin:25-jdk-alpine
WORKDIR /app

# Copy file .jar từ bước build
COPY --from=build /app/target/*.jar app.jar

# Expose cổng
EXPOSE 8000

# Lệnh chạy
ENTRYPOINT ["java", "-jar", "app.jar"]